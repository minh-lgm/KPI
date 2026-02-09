import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include data folder in serverless functions
  outputFileTracingIncludes: {
    '/api/*': ['./data/**/*'],
  },
};

export default nextConfig;
