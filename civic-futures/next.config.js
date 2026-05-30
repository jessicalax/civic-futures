/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // photos can be a few MB
    },
  },
};

module.exports = nextConfig;
