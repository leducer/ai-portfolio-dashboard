import { streamText, convertToModelMessages, tool, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { profileCache } from "@/lib/profile-cache";

// Explizit die Node.js-Runtime (Standard in dieser Next.js-Version) statt
// der veralteten Edge-Runtime, plus großzügiges Zeitlimit, damit auch
// längere Streaming-Antworten nicht vorzeitig vom Deployment-Ziel gekappt
// werden.
export const runtime = "nodejs";
export const maxDuration = 30;

// @ai-sdk/google liest standardmäßig GOOGLE_GENERATIVE_AI_API_KEY.
// Wir binden den Provider hier explizit an GEMINI_API_KEY.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Server-seitiger Supabase-Client mit dem Service-Role-Key, damit wir RLS
// umgehen und den Lebenslauf-Text zuverlässig aus dem Backend lesen können.
// Dieser Client darf NIEMALS im Browser verwendet werden.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FEATURED_GITHUB_REPOSITORIES = [
  {
    title: "ai-portfolio-dashboard",
    description:
      "Ein vollständig KI-gesteuertes Senior Portfolio mit Echtzeit-Gemini-Streaming, Supabase-Caching und automatischen Resend-E-Mail-Alerts.",
    stars: 12,
    language: "TypeScript",
    url: "https://github.com/leducer/ai-portfolio-dashboard",
  },
  {
    title: "nextjs-pattern-library",
    description:
      "Eine hochmoderne UI-Komponentenbibliothek nach Atomic Design Prinzipien für skalierbare Web-Apps.",
    stars: 42,
    language: "React.js",
    url: "https://github.com/leducer/nextjs-pattern-library",
  },
  {
    title: "gemini-streaming-chat",
    description:
      "Ein latenzarmes Chat-Interface mit tokenweisem Gemini-Streaming, Tool-Calling und Terminal-UX für Recruiter-Workflows.",
    stars: 18,
    language: "TypeScript",
    url: "https://github.com/leducer/gemini-streaming-chat",
  },
];

// Tools, die das Modell aufrufen kann. `showContactInformation` liefert
// strukturierte Kontaktdaten statt sie als Fließtext auszuschreiben – das
// Frontend kann den Tool-Call dadurch gezielt als Kontaktkarte rendern.
// `showGithubRepositories` liefert kuratierte Open-Source-Projekte, die
// das Frontend als Repo-Karten rendern kann.
const tools = {
  showContactInformation: tool({
    description:
      "Wird aufgerufen, wenn der Benutzer nach Kontaktdaten, E-Mail, Telefonnummer oder Kontaktmöglichkeiten des Entwicklers fragt.",
    inputSchema: z.object({}),
    execute: async () => ({
      name: "Canh Viet-Duc Da Silva Le",
      email: "leducer@gmail.com",
      phone: "+49 173 2611236",
    }),
  }),
  showGithubRepositories: tool({
    description:
      "Wird aufgerufen, wenn der Benutzer nach Projekten, GitHub, Repositories, Code-Beispielen oder Open-Source-Arbeiten des Entwicklers fragt.",
    inputSchema: z.object({}),
    execute: async () => FEATURED_GITHUB_REPOSITORIES,
  }),
  getAvailability: tool({
    description:
      "Wird aufgerufen, wenn der Benutzer nach der Verfügbarkeit, Auslastung, freien Kapazitäten oder dem nächstmöglichen Starttermin des Entwicklers fragt.",
    inputSchema: z.object({}),
    execute: async () => {
      const { data, error } = await supabase
        .from("profile_data")
        .select("content")
        .eq("key", "availability")
        .single();

      if (error) {
        console.error("Supabase-Fehler beim Laden der Verfügbarkeit:", error.message);
        return { error: "Verfügbarkeit konnte nicht geladen werden." };
      }

      try {
        const parsed =
          typeof data?.content === "string" ? JSON.parse(data.content) : data?.content;
        return {
          status: String(parsed?.status ?? ""),
          date: String(parsed?.date ?? ""),
          capacity: String(parsed?.capacity ?? ""),
          notes: String(parsed?.notes ?? ""),
        };
      } catch (err) {
        console.error("Verfügbarkeits-JSON konnte nicht geparst werden:", err);
        return { error: "Verfügbarkeitsdaten sind ungültig." };
      }
    },
  }),
};

// Der Lebenslauf-Text ist statisch. Der Supabase-Client baut pro Kaltstart
// eine eigene Verbindung auf (TCP-/TLS-Handshake) – dieser Overhead lohnt
// sich für einen unveränderlichen Wert nicht bei JEDER Chat-Anfrage. Daher
// halten wir das Ergebnis in einer modulweiten Variable im Speicher: Sie
// bleibt für die gesamte Lebensdauer der warmen Node.js-Instanz erhalten,
// Supabase wird dadurch effektiv nur noch einmal abgefragt.
async function loadCvTextIntoCache(): Promise<void> {
  const { data, error } = await supabase
    .from("profile_data")
    .select("content")
    .eq("key", "cv_text")
    .single();

  if (error) {
    console.error("Supabase-Fehler beim Laden des Lebenslaufs:", error.message);
    return;
  }

  profileCache.cachedCvText = data?.content ?? null;
}

function buildSystemPrompt(resumeText: string | null): string {
  const wissensbasis = resumeText
    ? `"""\n${resumeText}\n"""`
    : `"""\nAktuell steht kein Lebenslauf-Text zur Verfügung. Weise den Recruiter\nfreundlich darauf hin, dass die Wissensbasis gerade nicht geladen werden konnte.\n"""`;

  return `
Du bist der AI Recruiter Agent von diesem Entwickler. Nutze den folgenden
Lebenslauf-Text als deine absolute Wissensbasis, um alle Fragen des
Recruiters präzise zu beantworten.

# Lebenslauf
${wissensbasis}

# Verhaltensregeln
- Sprich in der Ich-Form, so als wärst du der Entwickler selbst.
- Beantworte Fragen präzise und auf Basis des obigen Lebenslauf-Texts.
- Strukturiere Aufzählungen (z.B. Skills, Erfahrungen) als Bulletpoints.
- Tonfall: professionell, selbstbewusst und nahbar – kein unnötiges Geschwafel.
- Bei tiefen technischen Backend-Fragen, die über den Lebenslauf hinausgehen,
  antworte charmant und selbstbewusst; verweise ehrlich darauf, wenn Details
  nicht im Lebenslauf stehen, statt zu bluffen.
- Wenn der Benutzer nach Kontaktdaten fragt, nutze zwingend das Tool
  "showContactInformation", anstatt die Daten als reinen Text auszuschreiben.
- Wenn der Recruiter nach deinen Projekten oder GitHub sucht, nutze
  zwingend das Tool "showGithubRepositories".
- Wenn der Benutzer nach Verfügbarkeit, Auslastung, freien Kapazitäten
  oder dem nächstmöglichen Starttermin fragt, nutze zwingend das Tool
  "getAvailability", anstatt die Daten als reinen Text auszuschreiben.
- Wenn der Benutzer (Recruiter) andeutet, dass er dir ein Jobangebot machen
  möchte, dich für ein Projekt buchen will oder dich kontaktieren möchte,
  antworte ihm freundlich und weise ihn explizit darauf hin, dass er direkt
  das "Job-Anfrage-Formular" auf der rechten Seite des Dashboards nutzen
  kann, um die Details einzutragen.
- Wenn der Benutzer nach einem klassischen Lebenslauf, einer PDF-Datei,
  einem Dokument zum Ausdrucken oder Speichern meines Profils fragt,
  antworte freundlich und weise ihn explizit darauf hin, dass er oben
  rechts auf dem Dashboard den Button "[DOWNLOAD_CV.PDF]" klicken kann,
  um die vollständige PDF-Datei direkt herunterzuladen.
`.trim();
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Nur beim allerersten Request (kalter Cache) wird Supabase tatsächlich
  // kontaktiert. Bei jedem weiteren Request auf derselben warmen Instanz
  // wird der teure Verbindungsaufbau komplett übersprungen.
  if (profileCache.cachedCvText === null) {
    try {
      await loadCvTextIntoCache();
    } catch (err) {
      console.error("Unerwarteter Fehler beim Laden des Lebenslaufs:", err);
    }
  }

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system: buildSystemPrompt(profileCache.cachedCvText),
    messages: await convertToModelMessages(messages),
    // Verhindert, dass lange Antworten (z.B. detaillierte Lebenslauf-Zusammenfassungen)
    // mitten im Satz abgeschnitten werden.
    maxOutputTokens: 4096,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
