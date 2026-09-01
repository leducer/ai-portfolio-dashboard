"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import TerminalLine from "@/components/atoms/TerminalLine";
import TerminalInput from "@/components/atoms/TerminalInput";

const WELCOME_MESSAGE = "Willkommen im AI Interface. Stell mir eine Frage zu meinem Profil.";

const MESSAGE_TRANSITION = { duration: 0.25, ease: "easeOut" as const };

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

export default function Terminal() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // `useChat` liefert in dieser SDK-Version keinen `isLoading`-Flag direkt,
  // sondern den granuläreren `status`. Wir leiten daraus zwei Zustände ab:
  // "wartet noch auf den ersten Token" (Denk-Anzeige) und "streamt aktiv
  // Text" (blinkender Tipp-Cursor am Ende der Antwort).
  const isLoading = status === "submitted" || status === "streaming";
  const isAwaitingFirstToken = status === "submitted";
  const isStreamingResponse = status === "streaming";
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

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
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isAwaitingFirstToken && (
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
