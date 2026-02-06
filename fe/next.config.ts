import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Disable telemetry in production
  ...(process.env.NODE_ENV === "production" && {
    telemetry: false,
  }),
};

export default nextConfig;
