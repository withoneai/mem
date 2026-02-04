import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.picaos.com",
        pathname: "/connectors/**",
      },
    ],
  },
};

export default nextConfig;
