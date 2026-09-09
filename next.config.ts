import type { NextConfig } from "next";

export const REFERRER_POLICY = "strict-origin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    qualities: [75, 90],
  },
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: REFERRER_POLICY,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
