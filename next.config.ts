import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to accept requests proxied through a Cloudflare Quick Tunnel
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
