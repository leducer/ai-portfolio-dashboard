import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createClient } from "@supabase/supabase-js";

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

async function fetchResumeText(): Promise<string | null> {
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

    return data?.content ?? null;
  } catch (err) {
    console.error("Unerwarteter Fehler beim Laden des Lebenslaufs:", err);
    return null;
  }
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
  });

  return result.toUIMessageStreamResponse();
}
