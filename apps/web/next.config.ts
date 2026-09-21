import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return [
      {
        source: "/admin/mentors/external_specialists",
        destination: "/admin/mentors/external-specialists",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/admin/mentors/external_specialists",
        destination: "/admin/mentors/external-specialists",
      },
    ];
  },
};

export default nextConfig;
