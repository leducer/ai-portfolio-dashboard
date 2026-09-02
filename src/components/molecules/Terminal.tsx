"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import AvailabilityCard, { type AvailabilityCardProps } from "@/components/atoms/AvailabilityCard";
import ContactCard from "@/components/atoms/ContactCard";
import GithubRepoCard, { type GithubRepoCardProps } from "@/components/atoms/GithubRepoCard";
import SpeechButton from "@/components/atoms/SpeechButton";
import TerminalLine from "@/components/atoms/TerminalLine";
import TerminalInput from "@/components/atoms/TerminalInput";

const WELCOME_MESSAGE = "Willkommen im AI Interface. Stell mir eine Frage zu meinem Profil.";

const MESSAGE_TRANSITION = { duration: 0.25, ease: "easeOut" as const };

const CONTACT_INFO_TOOL_NAME = "showContactInformation";
const GITHUB_REPOS_TOOL_NAME = "showGithubRepositories";
const AVAILABILITY_TOOL_NAME = "getAvailability";

type Availability = Pick<AvailabilityCardProps, "status" | "date" | "capacity" | "notes">;

type GithubRepository = Pick<
  GithubRepoCardProps,
  "title" | "description" | "stars" | "language" | "url"
>;

function isAvailability(value: unknown): value is Availability {
  if (typeof value !== "object" || value === null) return false;
  const availability = value as Record<string, unknown>;
  return (
    typeof availability.status === "string" &&
    typeof availability.date === "string" &&
    typeof availability.capacity === "string" &&
    typeof availability.notes === "string"
  );
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function isGithubRepository(value: unknown): value is GithubRepository {
  if (typeof value !== "object" || value === null) return false;
  const repo = value as Record<string, unknown>;
  return (
    typeof repo.title === "string" &&
    typeof repo.description === "string" &&
    typeof repo.stars === "number" &&
    typeof repo.language === "string" &&
    typeof repo.url === "string"
  );
}

/**
 * In AI SDK v3/v4 lagen Tool-Calls unter `message.toolInvocations` mit
 * `state === "result"`. In v6 sind das `message.parts` (via `isToolUIPart`)
 * mit `state === "output-available"`.
 */
function getToolInvocations(message: UIMessage) {
  return message.parts.filter(isToolUIPart);
}

export default function Terminal() {
  const [input, setInput] = useState("");
  const inputRef = useRef("");
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
    const next = e.target.value;
    // Ref sofort schreiben: SpeechRecognition ruft onChange und oft direkt
    // danach onend/Submit auf – der State wäre sonst noch der alte Wert.
    inputRef.current = next;
    setInput(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputRef.current.trim();
    if (!trimmed || isLoading) return;

    sendMessage({ text: trimmed });
    inputRef.current = "";
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
        {messages.length === 0 && (
          <div>
            <TerminalLine sender="agent" text={WELCOME_MESSAGE} />
            <div className="mt-1 flex justify-end">
              <SpeechButton text={WELCOME_MESSAGE} />
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isAgent = message.role !== "user";
            const messageText = getMessageText(message);
            const isCurrentlyStreaming =
              isStreamingResponse && isAgent && message.id === lastMessageId;
            const toolInvocations = isAgent ? getToolInvocations(message) : [];
            const showSpeechButton =
              isAgent && !isCurrentlyStreaming && messageText.trim() !== "";

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={MESSAGE_TRANSITION}
              >
                <TerminalLine
                  sender={isAgent ? "agent" : "user"}
                  text={messageText}
                  showCursor={isCurrentlyStreaming}
                />
                {showSpeechButton && (
                  <div className="mt-1 flex justify-end">
                    <SpeechButton text={messageText} />
                  </div>
                )}
                {toolInvocations.map((invocation) => {
                  const toolName = getToolName(invocation);
                  // v6: `output-available` entspricht dem früheren `state === "result"`.
                  // Das alte Literal "result" existiert im aktuellen `ToolUIPart`-Typen-Set
                  // nicht mehr, weshalb der Vergleich hier entfällt.
                  const hasResult = invocation.state === "output-available";

                  if (toolName === CONTACT_INFO_TOOL_NAME && hasResult) {
                    return (
                      <ContactCard
                        key={invocation.toolCallId}
                        className="mt-2"
                        onAnimationComplete={() => scrollToBottom()}
                      />
                    );
                  }

                  if (toolName === GITHUB_REPOS_TOOL_NAME && hasResult) {
                    const repositories = Array.isArray(invocation.output)
                      ? invocation.output.filter(isGithubRepository)
                      : [];

                    return (
                      <div
                        key={invocation.toolCallId}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
                      >
                        {repositories.map((repo, index) => (
                          <GithubRepoCard
                            key={repo.url}
                            title={repo.title}
                            description={repo.description}
                            stars={repo.stars}
                            language={repo.language}
                            url={repo.url}
                            onAnimationComplete={
                              index === repositories.length - 1
                                ? () => scrollToBottom()
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    );
                  }

                  if (toolName === AVAILABILITY_TOOL_NAME && hasResult && isAvailability(invocation.output)) {
                    return (
                      <AvailabilityCard
                        key={invocation.toolCallId}
                        className="mt-2"
                        status={invocation.output.status}
                        date={invocation.output.date}
                        capacity={invocation.output.capacity}
                        notes={invocation.output.notes}
                        onAnimationComplete={() => scrollToBottom()}
                      />
                    );
                  }

                  return null;
                })}
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
