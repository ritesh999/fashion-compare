/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow streaming responses
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
