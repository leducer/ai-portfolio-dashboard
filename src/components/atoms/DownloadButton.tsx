"use client";

import { motion } from "framer-motion";

const CV_FILE_PATH = "/cv-daSilvaLe.pdf";
const CV_FILE_NAME = "cv-daSilvaLe.pdf";

interface DownloadButtonProps {
  /** Zusätzliche Klassen, z.B. für Abstände im umgebenden Layout. */
  className?: string;
}

export default function DownloadButton({ className = "" }: DownloadButtonProps) {
  return (
    <motion.a
      href={CV_FILE_PATH}
      download={CV_FILE_NAME}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-md border border-brand-neon/40 bg-transparent px-4 py-2 font-mono text-sm text-white transition-colors hover:border-brand-neon hover:text-brand-neon ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0"
      >
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      <span>[DOWNLOAD_CV.PDF]</span>
    </motion.a>
  );
}
