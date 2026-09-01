import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) relies on Node.js-specific worker/file
  // resolution that breaks when bundled by Turbopack/webpack. Loading it
  // as a native Node `require` avoids the "fake worker" resolution error.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
