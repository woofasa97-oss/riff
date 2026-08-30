/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 is a native module — never bundle it (it pulls in `fs`/`path`/native bindings
  // that webpack cannot resolve, e.g. when the instrumentation hook is compiled for the edge
  // runtime). Keep it a plain runtime require, resolved by Node.
  serverExternalPackages: ['better-sqlite3'],
  images: {
    // The reference screens point at UX Pilot's bucket. Those assets will rot — move demo
    // imagery into public/mock/ as screens get built, then drop this entry.
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/uxpilot-auth.appspot.com/**' },
    ],
  },
}

export default nextConfig
