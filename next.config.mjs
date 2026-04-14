/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',

  basePath: '/portal',
  assetPrefix: '/portal/',

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },
}

export default nextConfig