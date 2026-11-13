import os from "node:os";
import type { NextConfig } from "next";

function getLocalNetworkHosts(): string[] {
  const hosts: string[] = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (!entry.internal && entry.family === "IPv4") {
        hosts.push(entry.address);
      }
    }
  }
  return hosts;
}

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: getLocalNetworkHosts(),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
