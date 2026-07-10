import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    reactStrictMode: true,
  // Add config for display image from other sources(Backend API)
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "8000",
                pathname: "/storage/**",
            },
            {
                protocol: "http",
                hostname: "127.0.0.1",
                port: "8000",
                pathname: "/storage/**",
            }
        ],
    },
}

export default nextConfig;
