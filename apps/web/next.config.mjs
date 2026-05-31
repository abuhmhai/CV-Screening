/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["@packages/ui"]
  }
};

export default nextConfig;
