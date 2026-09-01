import ReactMarkdown from "react-markdown";

type Sender = "user" | "agent";

interface TerminalLineProps {
  sender: Sender;
  text: string;
  /** Zeigt einen blinkenden Cursor-Block direkt nach dem Text an (aktives Streaming). */
  showCursor?: boolean;
}

const PREFIX_CONFIG: Record<Sender, { label: string; className: string }> = {
  user: {
    label: "👉 Recruiter:",
    className: "text-brand-accent",
  },
  agent: {
    label: "🤖 Agent:",
    className: "text-brand-neon",
  },
};

// `prose`/`prose-invert` (via @tailwindcss/typography) sorgen für sauber
// eingerückte Listen (ul/li) und Absatzabstände. Da `prose-invert` seine
// Farben über CSS-Variablen setzt (nicht über vererbtes `color`), müssen wir
// diese Variablen explizit auf unser Neon-Grün umbiegen, damit Fließtext,
// Bulletpoints, Überschriften und Fettdruck des Agenten in der Brand-Farbe
// bleiben statt im Standard-Grau von `prose-invert` zu landen.
const AGENT_MARKDOWN_CLASSNAME =
  "prose prose-invert max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words " +
  // `prose` bringt von Haus aus großzügige em-basierte Abstände mit (gedacht
  // für Blog-Artikel, nicht für ein kompaktes Terminal). Wir ziehen Absätze,
  // Listen und Listeneinträge deshalb explizit auf ein einheitliches, enges
  // Maß zusammen und nehmen Listenpunkten ihren eigenen Innenabstand komplett.
  "prose-p:my-1 first:prose-p:mt-0 last:prose-p:mb-0 " +
  "prose-ul:my-1 prose-ul:list-disc prose-ul:pl-5 " +
  "prose-ol:my-1 prose-ol:list-decimal prose-ol:pl-5 " +
  "prose-li:my-0 prose-li:marker:text-brand-neon " +
  "prose-headings:my-2 " +
  "[--tw-prose-body:var(--color-brand-neon)] [--tw-prose-bold:var(--color-brand-neon)] " +
  "[--tw-prose-bullets:var(--color-brand-neon)] [--tw-prose-headings:var(--color-brand-neon)] " +
  "[--tw-prose-links:var(--color-brand-neon)] [--tw-prose-code:var(--color-brand-neon)]";

export default function TerminalLine({ sender, text, showCursor = false }: TerminalLineProps) {
  const { label, className } = PREFIX_CONFIG[sender];

  return (
    <div className="flex items-start gap-2 font-mono">
      <span className={`shrink-0 ${className}`}>{label}</span>
      {/* min-w-0 ist nötig, damit dieses Flex-Item unter seine intrinsische
          Breite schrumpfen darf – sonst brechen lange Zeilen nicht um und
          laufen horizontal aus dem Terminal heraus.
          WICHTIG: Dieser Container muss ein <div> sein, kein <span>! Für den
          Agenten hängen wir hier ein <div> (den Markdown-Wrapper) ein, und
          <div> ist im HTML-Content-Model kein gültiges Kind von <span>
          (Block- in Inline-Element). Der Browser "reparierte" das beim
          initialen HTML-Parsing automatisch, indem er das <div> aus dem
          <span> heraus verschoben hat – das zerstörte das Flex-Layout
          (Bullet-Punkte und Text landeten optisch getrennt) und erzeugte
          einen React-Hydration-Fehler. */}
      <div className="min-w-0 flex-1 text-white/90">
        {sender === "agent" ? (
          // ReactMarkdown selbst rendert keinen Wrapper-Tag (nur ein Fragment
          // aus p/ul/li/...), daher muss der Container das Styling tragen.
          <div className={AGENT_MARKDOWN_CLASSNAME}>
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        ) : (
          <span className="whitespace-pre-wrap break-words">{text}</span>
        )}
        {showCursor && (
          <span
            aria-hidden="true"
            className="ml-1 inline-block h-4 w-[0.5ch] -translate-y-0.5 animate-blink bg-brand-neon align-middle"
          />
        )}
      </div>
    </div>
  );
}
