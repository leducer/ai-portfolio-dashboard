import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) relies on Node.js-specific worker/file
  // resolution that breaks when bundled by Turbopack/webpack. Loading it
  // as a native Node `require` avoids the "fake worker" resolution error.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // Ohne diese explizite Root sucht Turbopack automatisch nach Lockfiles in
  // Elternverzeichnissen und findet die verwaiste /Users/leducer/package-lock.json.
  // Dadurch würde es fälschlich versuchen, das GESAMTE Home-Verzeichnis zu
  // beobachten – was zu "EMFILE: too many open files" und einer
  // Neustart-Endlosschleife des Dev-Servers führt.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
