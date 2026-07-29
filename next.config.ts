import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "pub-b74e1fad186743fd98aac094770c4b8f.r2.dev",
      },
    ],
  },
};

export default nextConfig;
