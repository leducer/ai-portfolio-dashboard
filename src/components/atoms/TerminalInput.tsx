"use client";

import type { ChangeEvent, FormEvent } from "react";

interface TerminalInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function TerminalInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Frag den Agenten etwas...",
  disabled = false,
}: TerminalInputProps) {
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
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 border-none bg-transparent text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed"
      />
    </form>
  );
}
