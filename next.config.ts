import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A lockfile in a parent folder would otherwise be picked as the workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
  // Keep links and search rankings from the previous rcet.uet.edu.pk site working.
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/vision-and-mission", destination: "/about#vision", permanent: true },
      { source: "/campus/:path*", destination: "/facilities", permanent: true },
      { source: "/contact", destination: "/#visit", permanent: true },
    ];
  },
};

export default nextConfig;
