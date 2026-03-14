/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow streaming responses
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
