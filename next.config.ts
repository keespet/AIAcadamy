import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Use Webpack for production builds (required for next-pwa)
  // Turbopack is used in development by default
  turbopack: {},
};

export default withPWA(nextConfig);
