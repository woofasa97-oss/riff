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
      // A warm-up failure must not crash boot: the request path still opens the DB lazily and
      // surfaces its own error. Log and carry on.
      console.error('[riff] database warm-up failed:', (err as Error).message)
    }
  }
}
