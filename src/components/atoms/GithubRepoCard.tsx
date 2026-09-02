"use client";

import { motion } from "framer-motion";

export interface GithubRepoCardProps {
  title: string;
  description: string;
  stars: number;
  language: string;
  url: string;
  className?: string;
  /** Wird nach dem Scale-/Fade-In aufgerufen – z.B. damit das Terminal nachscrollt. */
  onAnimationComplete?: () => void;
}

/** GitHub-Linguist-Farben für gängige Sprachen (Fallback: neutrales Grau). */
const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "#3178c6",
  javascript: "#f1e05a",
  python: "#3572A5",
  go: "#00ADD8",
  rust: "#dea584",
  java: "#b07219",
  kotlin: "#A97BFF",
  swift: "#F05138",
  html: "#e34c26",
  css: "#563d7c",
  scss: "#c6538c",
  vue: "#41b883",
  react: "#61dafb",
  shell: "#89e051",
  c: "#555555",
  "c++": "#f34b7d",
  "c#": "#178600",
  php: "#4F5D95",
  ruby: "#701516",
  dart: "#00B4AB",
  elixir: "#6e4a7e",
  haskell: "#5e5086",
  scala: "#c22d40",
  dockerfile: "#384d54",
};

function languageColor(language: string): string {
  return LANGUAGE_COLORS[language.toLowerCase()] ?? "#8b949e";
}

function formatStarCount(stars: number): string {
  return new Intl.NumberFormat("en", {
    notation: stars >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(stars);
}

export default function GithubRepoCard({
  title,
  description,
  stars,
  language,
  url,
  className = "",
  onAnimationComplete,
}: GithubRepoCardProps) {
  const color = languageColor(language);

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onAnimationComplete={onAnimationComplete}
      className={`block w-full rounded-lg border border-white/10 bg-brand-dark/40 p-4 font-mono backdrop-blur-sm transition-all hover:border-brand-neon/50 hover:shadow-[0_0_28px_-6px_var(--color-brand-glow)] ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <GithubIcon />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
          {title}
        </h3>
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/55">
        {description}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs text-white/70">
          <StarIcon />
          <span>{formatStarCount(stars)}</span>
        </span>

        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] tracking-wide"
          style={{
            borderColor: `${color}66`,
            backgroundColor: `${color}1a`,
            color,
          }}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          {language}
        </span>
      </div>
    </motion.a>
  );
}

function GithubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="mt-0.5 h-4 w-4 shrink-0 text-white/70"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-3.5 w-3.5 text-brand-neon/80"
    >
      <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
    </svg>
  );
}
