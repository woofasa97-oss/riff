/**
 * Next.js runs this once when the server process starts, before it serves any request.
 *
 * We warm the SQLite database here — opening it, running migrations, and seeding the fixture
 * world — so the FIRST user request does not pay that cost. better-sqlite3 is synchronous, so
 * seeding blocks the event loop; on a cold Render boot the map fires several RSC prefetches at
 * once (/jams, /notifications, /discover, /me), and if the first of those had to seed the DB
 * inline it would block the others long enough for the platform to 503 them — which surfaced as
 * the "tap twice to navigate" bug. Doing it at startup takes the collision off the request path.
 */
export async function register() {
  // Only the Node.js runtime has the database. Guarding with `=== 'nodejs'` around the dynamic
  // import keeps the native module out of the edge (middleware) bundle entirely.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { db } = await import('@/server/db')
      db()
    } catch (err) {
      // PROTOTYPE MODE: warm-up failures never kill the boot — db.ts falls back to an
      // ephemeral database on its own, and the request path opens it lazily if even the
      // warm-up path raced. When this graduates to a durable deployment, restore the
      // process.exit(1) on a "Riff refuses to start" message so a detached disk fails the
      // deploy and the platform keeps the last healthy release serving.
      console.error('[riff] database warm-up failed:', (err as Error).message ?? err)
    }
  }
}
