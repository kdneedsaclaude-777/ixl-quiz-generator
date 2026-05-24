import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit ships .afm font data files that Next's bundler doesn't trace.
  // Keeping it (and exceljs) external lets them load from node_modules with
  // their data assets intact at runtime.
  serverExternalPackages: ["pdfkit", "exceljs"],
};

export default nextConfig;
