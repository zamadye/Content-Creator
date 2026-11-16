import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN ?? "http://127.0.0.1:3100";
const config: NextConfig = {
  async rewrites() {
    return [{ source: "/studio-api/:path*", destination: `${apiOrigin}/:path*` }];
  },
};
export default config;
