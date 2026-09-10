import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Arena preview host + local dev
  allowedDevOrigins: ["*.e2b.app", "localhost"],
};

export default nextConfig;
