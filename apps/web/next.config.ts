import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
