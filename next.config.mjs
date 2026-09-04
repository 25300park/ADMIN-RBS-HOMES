/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 1,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "mrhomes2024.s3.ap-southeast-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
