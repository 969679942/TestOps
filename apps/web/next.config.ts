import type { NextConfig } from "next";

const apiProxyTarget = process.env.TESTOPS_API_BASE_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
