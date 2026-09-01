"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import ContactCard from "@/components/atoms/ContactCard";
import TerminalLine from "@/components/atoms/TerminalLine";
import TerminalInput from "@/components/atoms/TerminalInput";

const WELCOME_MESSAGE = "Willkommen im AI Interface. Stell mir eine Frage zu meinem Profil.";

const MESSAGE_TRANSITION = { duration: 0.25, ease: "easeOut" as const };

const CONTACT_INFO_TOOL_NAME = "showContactInformation";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

/**
 * Prüft, ob eine Assistant-Nachricht einen erfolgreich ausgeführten
 * `showContactInformation`-Tool-Call enthält (`state === "output-available"`
 * ist das v6-SDK-Äquivalent zum früheren `state === "result"`).
 */
function hasSuccessfulContactInfoToolCall(message: UIMessage): boolean {
  return message.parts.some(
    (part) =>
      isToolUIPart(part) &&
      getToolName(part) === CONTACT_INFO_TOOL_NAME &&
      part.state === "output-available"
  );
}

export default function Terminal() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ohne useMemo würde bei jedem Render eine neue Transport-Instanz
  // entstehen – das ist für eine "saubere" useChat-Konfiguration zu
  // vermeiden, da der Hook den Transport sonst unnötig für referenziell
  // instabil halten könnte.
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  // Wir setzen HIER absichtlich kein `experimental_throttle` (und keine
  // anderen künstlichen Delay-Optionen) – der Default (kein Throttling)
  // sorgt dafür, dass jedes einzelne gestreamte Zeichen sofort einen
  // Re-Render auslöst, ohne künstliche Sammel-Verzögerung.
  const { messages, sendMessage, status } = useChat({ transport });

  // `useChat` liefert in dieser SDK-Version keinen `isLoading`-Flag direkt,
  // sondern den granuläreren `status`.
  const isLoading = status === "submitted" || status === "streaming";
  const isStreamingResponse = status === "streaming";
  const lastMessageId = messages.at(-1)?.id;

  // Die Denk-Anzeige ("Agent denkt...") ist NUR sichtbar, solange noch gar
  // keine Assistant-Nachricht existiert. Sobald `messages` ein Element mit
  // `role === "assistant"` enthält – auch wenn dessen Text noch leer ist –
  // blenden wir sie aus und rendern stattdessen sofort die `TerminalLine`
  // mit blinkendem Cursor weiter, während der Text live eintrudelt.
  const isThinking = isLoading && messages.filter((m) => m.role === "assistant").length === 0;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div className="scanline w-full max-w-2xl overflow-hidden rounded-lg border border-brand-neon/20 bg-brand-dark/90 shadow-[0_0_60px_10px_var(--color-brand-glow)] backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-brand-neon/70" />
        <span className="ml-2 font-mono text-xs text-white/40">agent@portfolio:~</span>
      </div>

      <div className="flex h-[420px] flex-col gap-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && <TerminalLine sender="agent" text={WELCOME_MESSAGE} />}

        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isCurrentlyStreaming =
              isStreamingResponse && message.role !== "user" && message.id === lastMessageId;
            const showContactCard =
              message.role !== "user" && hasSuccessfulContactInfoToolCall(message);

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={MESSAGE_TRANSITION}
              >
                <TerminalLine
                  sender={message.role === "user" ? "user" : "agent"}
                  text={getMessageText(message)}
                  showCursor={isCurrentlyStreaming}
                />
                {showContactCard && (
                  <ContactCard
                    className="mt-2"
                    // Der Scale-In-Effekt ändert nur `transform`, nicht den
                    // Layout-Platzbedarf – trotzdem stoßen wir hier zur
                    // Sicherheit noch einen finalen Scroll an, z.B. falls
                    // Bilder/Fonts währenddessen nachladen und die Höhe
                    // minimal verschieben.
                    onAnimationComplete={() => scrollToBottom()}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 font-mono text-xs text-white/40"
            >
              <span>🤖 Agent denkt</span>
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="h-1.5 w-1.5 rounded-full bg-brand-neon"
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1.15, 0.75] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: dot * 0.2,
                    }}
                  />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Anker-Element für den Auto-Scroll per scrollIntoView */}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10">
        <TerminalInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
