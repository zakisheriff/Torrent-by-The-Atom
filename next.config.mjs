import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: []
  },
  outputFileTracingRoot: path.join(process.cwd()),
  serverExternalPackages: ["webtorrent"]
};

export default nextConfig;
