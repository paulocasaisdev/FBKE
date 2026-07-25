import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: (process.env.NODE_ENV === "production" && !process.env.VERCEL) ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;


