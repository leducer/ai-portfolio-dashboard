"use client";

import { motion } from "framer-motion";

const CONTACT_NAME = "Canh Viet-Duc Da Silva Le";
const CONTACT_EMAIL = "leducer@gmail.com";
const CONTACT_PHONE_DISPLAY = "+49 173 2611236";
const CONTACT_PHONE_HREF = "+491732611236";

interface ContactCardProps {
  /** Zusätzliche Klassen, z.B. für Abstände im umgebenden Terminal-Log. */
  className?: string;
  /**
   * Wird aufgerufen, sobald der Scale-In-Effekt abgeschlossen ist – damit
   * der aufrufende Log (Terminal) danach noch einmal zuverlässig ans Ende
   * scrollen kann, nachdem die Karte ihre finale Größe erreicht hat.
   */
  onAnimationComplete?: () => void;
}

export default function ContactCard({ className = "", onAnimationComplete }: ContactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onAnimationComplete={onAnimationComplete}
      className={`w-full max-w-sm rounded-lg border border-brand-accent/30 bg-brand-dark/50 p-4 font-mono shadow-[0_0_25px_-8px_rgba(0,229,255,0.4)] backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-semibold text-white">{CONTACT_NAME}</p>

        {/* Pulsing-Dot-Indikator: ein statischer Punkt plus ein sich
            aufblähender, ausblassender Ring darüber erzeugen den
            "Live-Verbindung"-Effekt. */}
        <div className="flex shrink-0 items-center gap-1.5 pt-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-neon opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-neon" />
          </span>
          <span className="text-[10px] uppercase tracking-wide text-brand-neon/80">
            Drahtlose Verbindung aktiv
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 text-sm">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-brand-accent transition-colors hover:text-brand-neon hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        <a
          href={`tel:${CONTACT_PHONE_HREF}`}
          className="text-brand-accent transition-colors hover:text-brand-neon hover:underline"
        >
          {CONTACT_PHONE_DISPLAY}
        </a>
      </div>
    </motion.div>
  );
}
