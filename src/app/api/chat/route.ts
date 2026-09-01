import { streamText, convertToModelMessages, tool, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

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

// Tools, die das Modell aufrufen kann. `showContactInformation` liefert
// strukturierte Kontaktdaten statt sie als Fließtext auszuschreiben – das
// Frontend kann den Tool-Call dadurch gezielt als Kontaktkarte rendern.
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
};

// Der Lebenslauf-Text ändert sich praktisch nie, wird aber vor JEDEM
// streamText()-Aufruf blockierend benötigt (er ist Teil des System-Prompts).
// Ohne Cache verzögert der Supabase-Roundtrip auf jeder einzelnen Chat-Anfrage
// den Zeitpunkt, an dem überhaupt mit dem Streaming begonnen werden kann.
// Ein einfacher In-Memory-Cache mit TTL spart diesen Roundtrip bei jeder
// Anfrage, die auf eine bereits "warme" Serverless-/Edge-Instanz trifft.
const RESUME_CACHE_TTL_MS = 5 * 60 * 1000;
let resumeCache: { text: string; expiresAt: number } | null = null;
let resumeFetchInFlight: Promise<string | null> | null = null;

async function fetchResumeText(): Promise<string | null> {
  if (resumeCache && resumeCache.expiresAt > Date.now()) {
    return resumeCache.text;
  }

  // Treffen mehrere Anfragen gleichzeitig auf einen leeren/abgelaufenen Cache,
  // teilen sie sich denselben Supabase-Call, statt die DB parallel mehrfach
  // zu belasten.
  if (!resumeFetchInFlight) {
    resumeFetchInFlight = (async () => {
      try {
        const { data, error } = await supabase
          .from("profile_data")
          .select("content")
          .eq("key", "cv_text")
          .single();

        if (error) {
          console.error("Supabase-Fehler beim Laden des Lebenslaufs:", error.message);
          return null;
        }

        const text = data?.content ?? null;
        if (text) {
          resumeCache = { text, expiresAt: Date.now() + RESUME_CACHE_TTL_MS };
        }
        return text;
      } catch (err) {
        console.error("Unerwarteter Fehler beim Laden des Lebenslaufs:", err);
        return null;
      } finally {
        resumeFetchInFlight = null;
      }
    })();
  }

  return resumeFetchInFlight;
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
`.trim();
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const resumeText = await fetchResumeText();

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system: buildSystemPrompt(resumeText),
    messages: await convertToModelMessages(messages),
    // Verhindert, dass lange Antworten (z.B. detaillierte Lebenslauf-Zusammenfassungen)
    // mitten im Satz abgeschnitten werden.
    maxOutputTokens: 4096,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
