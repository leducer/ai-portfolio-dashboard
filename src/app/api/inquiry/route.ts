import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

// Server-seitiger Supabase-Client mit Service-Role-Key, damit RLS für den
// Insert umgangen wird. Darf NIEMALS im Browser verwendet werden.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const NOTIFICATION_RECIPIENT = "leducer@gmail.com";
const NOTIFICATION_SENDER = "Portfolio Dashboard <onboarding@resend.dev>";

interface JobInquiryPayload {
  contact_name: string;
  email: string;
  phone: string;
  message: string;
  tech_stack: string;
  company?: string;
  salary_range?: string;
}

const REQUIRED_FIELDS = [
  "contact_name",
  "email",
  "phone",
  "message",
  "tech_stack",
] as const satisfies ReadonlyArray<keyof JobInquiryPayload>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(payload: Partial<JobInquiryPayload>): string | null {
  for (const field of REQUIRED_FIELDS) {
    if (!payload[field]?.toString().trim()) {
      return `Feld "${field}" ist erforderlich.`;
    }
  }

  if (!EMAIL_PATTERN.test(payload.email!.trim())) {
    return "Bitte eine gültige E-Mail-Adresse angeben.";
  }

  return null;
}

/** Eine einzelne Zeile in der Notification-E-Mail-Tabelle, optional übersprungen wenn leer. */
function emailRow(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #1f2a24; color: #7fffa0; font-family: monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; vertical-align: top;">
        ${label}
      </td>
      <td style="padding: 10px 16px; border-bottom: 1px solid #1f2a24; color: #e6ffe9; font-family: monospace; font-size: 14px; word-break: break-word;">
        ${value}
      </td>
    </tr>`;
}

function buildNotificationEmailHtml(data: {
  company: string | null;
  contactName: string;
  email: string;
  phone: string;
  techStack: string;
  message: string;
  salaryRange: string | null;
}): string {
  const rows = [
    emailRow("Firma", data.company),
    emailRow("Name", data.contactName),
    emailRow("E-Mail", `<a href="mailto:${data.email}" style="color:#7fffa0;">${data.email}</a>`),
    emailRow("Telefon", `<a href="tel:${data.phone}" style="color:#7fffa0;">${data.phone}</a>`),
    emailRow("Tech Stack", data.techStack),
    emailRow("Gehaltsrahmen", data.salaryRange),
  ].join("");

  return `
  <div style="margin: 0; padding: 24px 12px; background-color: #0a0f0c; font-family: monospace;">
    <table role="presentation" width="100%" style="max-width: 480px; margin: 0 auto; border-collapse: collapse; background-color: #0f1712; border: 1px solid #1f2a24; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 18px 16px; background-color: #12201a; border-bottom: 1px solid #1f2a24;">
          <p style="margin: 0; color: #7fffa0; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">
            🚀 Neue Job-Anfrage
          </p>
        </td>
      </tr>
      ${rows}
      <tr>
        <td colspan="2" style="padding: 14px 16px 4px; color: #7fffa0; font-family: monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
          Nachricht
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 4px 16px 18px; color: #e6ffe9; font-family: monospace; font-size: 14px; white-space: pre-wrap; word-break: break-word;">
          ${data.message}
        </td>
      </tr>
    </table>
  </div>`;
}

async function sendNotificationEmail(data: {
  company: string | null;
  contactName: string;
  email: string;
  phone: string;
  techStack: string;
  message: string;
  salaryRange: string | null;
}): Promise<void> {
  const subjectName = data.company || data.contactName;

  try {
    await resend.emails.send({
      from: NOTIFICATION_SENDER,
      to: NOTIFICATION_RECIPIENT,
      subject: `🚀 Neue Job-Anfrage von ${subjectName}!`,
      html: buildNotificationEmailHtml(data),
    });
  } catch (err) {
    // Die Anfrage wurde bereits erfolgreich in Supabase gespeichert – ein
    // Fehler beim Mailversand darf die Erfolgsantwort ans Frontend daher
    // nicht mehr verhindern, wird aber fürs Debugging geloggt.
    console.error("Resend-Fehler beim Versenden der Benachrichtigung:", err);
  }
}

export async function POST(req: Request) {
  let payload: Partial<JobInquiryPayload>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const validationError = validate(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const company = payload.company?.trim() || null;
  const contactName = payload.contact_name!.trim();
  const email = payload.email!.trim();
  const phone = payload.phone!.trim();
  const message = payload.message!.trim();
  const techStack = payload.tech_stack!.trim();
  const salaryRange = payload.salary_range?.trim() || null;

  const { error } = await supabase.from("job_inquiries").insert([
    {
      contact_name: contactName,
      email,
      phone,
      message,
      tech_stack: techStack,
      company,
      salary_range: salaryRange,
    },
  ]);

  if (error) {
    console.error("Supabase-Fehler beim Speichern der Job-Anfrage:", error.message);
    return NextResponse.json(
      { error: "Anfrage konnte nicht gespeichert werden. Bitte später erneut versuchen." },
      { status: 500 }
    );
  }

  await sendNotificationEmail({
    company,
    contactName,
    email,
    phone,
    techStack,
    message,
    salaryRange,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
