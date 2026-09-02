"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from "react";
import { flushSync } from "react-dom";

interface TerminalInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

export default function TerminalInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Frag den Agenten etwas...",
  disabled = false,
}: TerminalInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);
  const receivedResultRef = useRef(false);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  valueRef.current = value;
  onChangeRef.current = onChange;
  onSubmitRef.current = onSubmit;

  const clearAutoSubmitTimer = () => {
    if (autoSubmitTimerRef.current === null) return;
    clearTimeout(autoSubmitTimerRef.current);
    autoSubmitTimerRef.current = null;
  };

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) return;

      const current = valueRef.current;
      const nextValue = current.trim() ? `${current.trimEnd()} ${transcript}` : transcript;
      receivedResultRef.current = true;
      // Sofort committen, damit das Feld den Text zeigt, bevor onend feuert.
      flushSync(() => {
        onChangeRef.current({
          target: { value: nextValue },
        } as ChangeEvent<HTMLInputElement>);
      });
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!receivedResultRef.current) return;
      receivedResultRef.current = false;
      clearAutoSubmitTimer();
      // Kurze Pause, damit der Recruiter das Transkript sieht, bevor es rausgeht.
      autoSubmitTimerRef.current = setTimeout(() => {
        autoSubmitTimerRef.current = null;
        onSubmitRef.current({ preventDefault() {} } as FormEvent);
      }, 400);
    };

    recognition.onerror = () => {
      receivedResultRef.current = false;
      clearAutoSubmitTimer();
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      clearAutoSubmitTimer();
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!disabled || !isListening) return;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [disabled, isListening]);

  const toggleListening = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const recognition = recognitionRef.current;
    if (!recognition || disabled) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    try {
      receivedResultRef.current = false;
      clearAutoSubmitTimer();
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`flex items-center gap-2 bg-brand-dark px-3 py-2 font-mono transition-opacity duration-300 ${
        disabled ? "opacity-40" : "opacity-100"
      }`}
    >
      <span aria-hidden="true" className="animate-blink text-brand-neon">
        $
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          // Tastatur-Korrektur: geplantes Auto-Submit nach Sprache abbrechen.
          if (event.nativeEvent) clearAutoSubmitTimer();
          onChange(event);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 border-none bg-transparent text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed"
      />
      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          aria-label={isListening ? "Aufnahme stoppen" : "Spracheingabe starten"}
          aria-pressed={isListening}
          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider transition-colors disabled:cursor-not-allowed ${
            isListening
              ? "animate-pulse text-red-500 drop-shadow-[0_0_8px_var(--color-brand-neon)]"
              : "text-white/35 hover:text-brand-neon"
          }`}
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
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
          <span>[MIC]</span>
        </button>
      )}
    </form>
  );
}
