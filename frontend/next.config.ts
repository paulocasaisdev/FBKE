import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: (process.env.NODE_ENV === "production" && !process.env.VERCEL) ? "export" : undefined,
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://fbke.onrender.com/api/:path*",
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;


