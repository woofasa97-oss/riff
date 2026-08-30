/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // The reference screens point at UX Pilot's bucket. Those assets will rot — move demo
    // imagery into public/mock/ as screens get built, then drop this entry.
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/uxpilot-auth.appspot.com/**' },
    ],
  },
}

export default nextConfig
