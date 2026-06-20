import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirect the root URL to the simulator page
  async redirects() {
    return [
      {
        source: "/",
        destination: "/simulator",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
