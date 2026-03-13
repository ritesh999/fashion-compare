/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow streaming responses
  serverActions: {
    bodySizeLimit: "2mb",
  },
};

export default nextConfig;
