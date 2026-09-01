"use client";

import Terminal from "@/components/molecules/Terminal";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-brand-black px-4 py-16">
      <header className="text-center">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-white/50">
          Senior Frontend Engineer // AI Interface
        </p>
      </header>

      <Terminal />
    </div>
  );
}
