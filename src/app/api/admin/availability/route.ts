import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { profileCache } from "@/lib/profile-cache";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AvailabilityPayload {
  password: string;
  status: string;
  date: string;
  capacity: string;
  notes: string;
}

const REQUIRED_FIELDS = ["status", "date", "capacity", "notes"] as const;

function passwordsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isAuthorized(password: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") return false;
  return passwordsMatch(password, expected);
}

export async function POST(req: Request) {
  let payload: Partial<AvailabilityPayload>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  if (!isAuthorized(payload.password)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!payload[field]?.toString().trim()) {
      return NextResponse.json({ error: `Feld "${field}" ist erforderlich.` }, { status: 400 });
    }
  }

  const newData = {
    status: payload.status!.trim(),
    date: payload.date!.trim(),
    capacity: payload.capacity!.trim(),
    notes: payload.notes!.trim(),
  };

  const { data, error } = await supabase
    .from("profile_data")
    .update({ content: JSON.stringify(newData) })
    .eq("key", "availability")
    .select("key");

  if (error) {
    console.error("Supabase-Fehler beim Aktualisieren der Verfügbarkeit:", error.message);
    return NextResponse.json(
      { error: "Verfügbarkeit konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }

  if (!data?.length) {
    return NextResponse.json(
      { error: "Kein Verfügbarkeits-Eintrag gefunden." },
      { status: 404 }
    );
  }

  profileCache.cachedCvText = null;

  return NextResponse.json({ success: true }, { status: 200 });
}
