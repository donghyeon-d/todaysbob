import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-expect-error: Next.js dev server suggests this option but it might not be in the type definitions yet
  allowedDevOrigins: ['192.168.219.*'],
};

export default nextConfig;
