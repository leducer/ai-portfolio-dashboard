"use client";

import DownloadButton from "@/components/atoms/DownloadButton";
import JobForm from "@/components/molecules/JobForm";
import Terminal from "@/components/molecules/Terminal";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-10 bg-brand-black px-4 py-16">
      {/*
        Mobile: Name/Titel und Download-Button zentriert untereinander.
        Ab `sm`: Name/Titel links, Download-Button rechts daneben
        (`justify-between`), beide vertikal zentriert.
      */}
      <header className="flex w-full max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <p className="text-base font-semibold text-white">Canh Viet-Duc Da Silva Le</p>
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-white/50">
            Senior Frontend Engineer // AI Interface
          </p>
        </div>
        <DownloadButton />
      </header>

      {/*
        Desktop (lg+): 3-Spalten-Grid – Terminal nimmt 2/3 der Breite ein,
        JobForm 1/3, beide oben ausgerichtet (`items-start`), damit
        unterschiedliche Höhen nicht zu unschönem Stretching führen.
        Mobile: `grid-cols-1` lässt beide einfach in DOM-Reihenfolge
        (Terminal, dann JobForm) untereinander stapeln.
      */}
      <div className="grid w-full max-w-6xl grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="flex justify-center lg:col-span-2">
          <Terminal />
        </div>
        <div className="flex justify-center lg:col-span-1">
          <JobForm />
        </div>
      </div>
    </div>
  );
}
