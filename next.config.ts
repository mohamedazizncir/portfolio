import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in a parent directory
  // otherwise makes Next.js misdetect it.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
