/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'placehold.co',
      'placeholder.pics',
      'picsum.photos',
      'cloudflare-ipfs.com',
      '348ced26f17802f62b12ce710912eb6d.r2.cloudflarestorage.com'
    ],
    unoptimized: true,
  },
}

export default nextConfig
