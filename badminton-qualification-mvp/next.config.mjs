import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "nodemailer"],
    serverActions: {
      bodySizeLimit: "10mb"
    }
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd())
    };

    return config;
  }
};

export default nextConfig;
