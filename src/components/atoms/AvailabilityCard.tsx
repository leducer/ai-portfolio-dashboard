"use client";

import { motion } from "framer-motion";

export interface AvailabilityCardProps {
  status: string;
  date: string;
  capacity: string;
  notes: string;
  className?: string;
  onAnimationComplete?: () => void;
}

function isAvailableStatus(status: string): boolean {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("verfügbar") ||
    normalized.includes("available") ||
    normalized.includes("frei") ||
    normalized === "open"
  );
}

export default function AvailabilityCard({
  status,
  date,
  capacity,
  notes,
  className = "",
  onAnimationComplete,
}: AvailabilityCardProps) {
  const available = isAvailableStatus(status);
  const indicatorClass = available ? "bg-brand-neon" : "bg-yellow-400";
  const labelClass = available ? "text-brand-neon" : "text-yellow-400";
  const borderClass = available ? "border-brand-neon/30" : "border-yellow-400/30";
  const glowClass = available
    ? "shadow-[0_0_25px_-8px_rgba(0,255,102,0.45)]"
    : "shadow-[0_0_25px_-8px_rgba(250,204,21,0.4)]";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onAnimationComplete={onAnimationComplete}
      className={`w-full max-w-sm rounded-lg border bg-brand-dark/50 p-4 font-mono backdrop-blur-sm ${borderClass} ${glowClass} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          // Verfügbarkeit
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${indicatorClass}`}
            />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${indicatorClass}`} />
          </span>
          <span className={`text-[10px] uppercase tracking-wide ${labelClass}`}>
            {available ? "Available" : "Ausgelastet"}
          </span>
        </div>
      </div>

      <p className={`mt-3 text-base font-semibold ${labelClass}`}>{status}</p>

      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <Row label="Start" value={date} />
        <Row label="Kapazität" value={capacity} />
        {notes.trim() !== "" && <Row label="Notes" value={notes} />}
      </dl>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] uppercase tracking-wide text-white/40">{label}</dt>
      <dd className="text-white/85">{value}</dd>
    </div>
  );
}
