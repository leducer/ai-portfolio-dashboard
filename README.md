# 🤖 Agentic Portfolio Dashboard // Senior Frontend AI Interface

Interaktives Recruiter-Dashboard mit einem KI-Terminal, das Profilfragen live beantwortet und Anfragen autonom weiterverarbeitet — eine **Agentic UI**, in der das Modell nicht nur Text streamt, sondern Werkzeuge aufruft, Karten einblendet und Formulare an das Backend koppelt.

Dieses Repository orchestriert zwei eigenständige Module: das latenzarme Streaming-Backend und das Atomic-Design-UI. Zusammen bilden sie die Oberfläche unter [`src/app/page.tsx`](src/app/page.tsx) — Terminal links, Job-Anfrage rechts.

---

## Projekt-Übersicht

Recruiter stellen Fragen direkt im Terminal (`agent@portfolio:~`). Die Antworten kommen tokenweise von **Gemini 3.6 Flash** über die Serverless-Route [`/api/chat`](src/app/api/chat/route.ts). Als Wissensbasis dient der Lebenslauf-Text aus Supabase; der Agent spricht in der Ich-Form und bleibt an diese Quelle gebunden.

Das Interface ist agentisch, nicht nur chatbasiert:

- Das Modell entscheidet selbst, wann Kontakt- oder GitHub-Karten gerendert werden (Function Calling).
- Job-Anfragen laufen über eine eigene API-Route in PostgreSQL und lösen sofort eine Push-Mail aus.
- CV-Download, Terminal-Streaming und Formular sind lose gekoppelt — der Agent verweist Recruiter gezielt auf die passende UI-Fläche.

```
Recruiter
   │
   ├─ Terminal ────────── POST /api/chat ──► Gemini 3.6 Flash
   │                         │                      │
   │                         │                      ├─ Tool: showContactInformation
   │                         │                      └─ Tool: showGithubRepositories
   │                         │
   │                         └─ In-Memory-Cache ◄── Supabase (profile_data)
   │
   └─ JobForm ─────────── POST /api/inquiry ──► Supabase (job_inquiries)
                                              └─ Resend ──► Smartphone-Alert
```

---

## 🛠️ System-Architektur & Module

Das Dashboard ist die Integrationsschicht. Die eigentliche Streaming-Logik und das Design System leben in zwei verknüpften Repositories und werden hier als Module eingebunden.

### Modul 1: AI Streaming Backend

**Repo:** [leducer/gemini-streaming-chat](https://github.com/leducer/gemini-streaming-chat)

Tokenweises Gemini-Streaming, Tool-Calling und die Chat-Route unter [`src/app/api/chat/route.ts`](src/app/api/chat/route.ts). Das Frontend (`useChat` + `DefaultChatTransport`) spricht ausschließlich diese Route an — kein Provider-Key im Browser.

**Supabase In-Memory-Caching:** Der Lebenslauf in `profile_data` ist statisch. Ein Supabase-Client baut pro Kaltstart eine eigene TCP-/TLS-Verbindung auf; dieser Handshake lohnt sich nicht bei jeder Chat-Nachricht. Deshalb liegt der CV-Text in einer modulweiten Variable (`cachedCvText`). Sie überlebt die gesamte Lebensdauer der warmen Node.js-Instanz — Supabase wird effektiv nur einmal abgefragt, Folge-Requests überspringen den Verbindungsaufbau vollständig.

```ts
let cachedCvText: string | null = null;

if (cachedCvText === null) {
  await loadCvTextIntoCache(); // einmal pro warmer Instanz
}
```

Runtime: Node.js (`export const runtime = "nodejs"`), `maxDuration = 30`, `maxOutputTokens = 4096`, damit längere Streaming-Antworten nicht mitten im Satz abbrechen.

### Modul 2: Design System & UI

**Repo:** [leducer/nextjs-pattern-library](https://github.com/leducer/nextjs-pattern-library)

Die Oberfläche folgt **Atomic Design** im Next.js **App Router** (`src/app/`) und **Tailwind CSS v4 CSS-First Styling**. Tokens leben in [`src/app/globals.css`](src/app/globals.css) unter `@theme` — keine `tailwind.config.js`, Farben und Animationen sind CSS-Variablen (`--color-brand-neon`, `--animate-blink`).

| Ebene | Beispiele |
| --- | --- |
| Atoms | `TerminalLine`, `TerminalInput`, `ContactCard`, `GithubRepoCard`, `DownloadButton` |
| Molecules | `Terminal`, `JobForm` |
| Page | `src/app/page.tsx` — 2/3 Terminal, 1/3 Formular ab `lg` |

Komponenten unter `src/components/atoms/` und `src/components/molecules/` bleiben austauschbar; das Terminal rendert Tool-Ergebnisse als Karten, statt sie als Fließtext zu zeigen.

---

## 📬 Agentic Features

### Formular-Anbindungen

[`JobForm`](src/components/molecules/JobForm.tsx) sendet validierte Payloads an die Serverless-Route **`POST /api/inquiry`**. Die Route prüft Pflichtfelder und E-Mail-Format serverseitig und schreibt direkt in die Supabase-Tabelle `job_inquiries` (PostgreSQL, Service-Role-Key, kein Client-Zugriff).

Felder: `contact_name`, `email`, `phone`, `message`, `tech_stack` (required); `company`, `salary_range` (optional).

### Live Mail-Alerts

Nach erfolgreichem Insert versendet dieselbe Route über die **Resend API** eine HTML-Notification an das Entwickler-Smartphone. Ein Mail-Fehler rollt den bereits gespeicherten Datensatz nicht zurück — die Anfrage bleibt in der Datenbank, der Versandfehler wird nur geloggt.

### Dynamic Tool-Calling

Gemini 3.6 Flash ruft autonom JavaScript-Werkzeuge auf (`ai` SDK `tool()` + Zod-Schemas):

| Tool | Wann | UI im Terminal |
| --- | --- | --- |
| `showContactInformation` | Frage nach E-Mail, Telefon, Kontakt | [`ContactCard`](src/components/atoms/ContactCard.tsx) |
| `showGithubRepositories` | Frage nach Projekten, GitHub, Code | [`GithubRepoCard`](src/components/atoms/GithubRepoCard.tsx) Grid |

Die Tools liefern strukturierte Objekte, kein Fließtext. [`Terminal.tsx`](src/components/molecules/Terminal.tsx) mapped `output-available` Tool-Parts auf die Karten — der Agent steuert so die Oberfläche, ohne das Frontend hart zu verdrahten.

---

## Setup & Environment

```bash
npm install
cp .env.local.example .env.local   # oder Datei manuell anlegen
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### `.env.local`

| Variable | Zweck |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini (explizit an `@ai-sdk/google` gebunden) |
| `SUPABASE_URL` | Projekt-URL der Supabase-Instanz |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Key für `profile_data` und `job_inquiries` — niemals im Client |
| `RESEND_API_KEY` | Versand der Job-Anfrage-Alerts |

```env
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

Der Service-Role-Key umgeht RLS und darf ausschließlich in API-Routes (`/api/chat`, `/api/inquiry`) verwendet werden.
