"use client";

import { useEffect, useState } from "react";

interface SpeechButtonProps {
  text: string;
  className?: string;
}

export default function SpeechButton({ text, className = "" }: SpeechButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.pitch = 1;
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const disabled = !text.trim();

  return (
    <button
      type="button"
      onClick={toggleSpeech}
      disabled={disabled}
      aria-label={isSpeaking ? "Vorlesen stoppen" : "Antwort vorlesen"}
      aria-pressed={isSpeaking}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        isSpeaking
          ? "animate-pulse text-brand-neon"
          : "text-white/35 hover:text-brand-neon"
      } ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 shrink-0"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.08" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
      <span>[AUDIO]</span>
    </button>
  );
}
