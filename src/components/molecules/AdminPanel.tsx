"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AvailabilityFormData {
  password: string;
  status: string;
  date: string;
  capacity: string;
  notes: string;
}

const INITIAL_FORM: AvailabilityFormData = {
  password: "",
  status: "",
  date: "",
  capacity: "",
  notes: "",
};

const INPUT_CLASSNAME =
  "w-full rounded-md border border-white/10 bg-brand-black/40 px-3 py-2 font-mono text-sm text-white " +
  "outline-none transition-colors placeholder:text-white/30 " +
  "focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/20";

const SUCCESS_MESSAGE = ">> [SUCCESS]: Verfügbarkeit live aktualisiert.";

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<AvailabilityFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Update fehlgeschlagen.");
      }

      setSuccess(true);
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unerwarteter Fehler.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.form
            key="admin-form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-lg border border-white/10 bg-brand-dark/80 p-4 font-mono shadow-[0_0_40px_8px_var(--color-brand-glow)] backdrop-blur-md"
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">
              // Admin · Verfügbarkeit
            </p>

            <div className="flex flex-col gap-3">
              <Field
                name="password"
                type="password"
                label="Passwort"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <Field
                name="status"
                label="Status"
                placeholder="z.B. Verfügbar"
                value={formData.status}
                onChange={handleChange}
                required
              />
              <Field
                name="date"
                label="Startdatum"
                placeholder="z.B. ab April 2026"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <Field
                name="capacity"
                label="Kapazität"
                placeholder="z.B. 3 Tage / Woche"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
              <Field
                name="notes"
                as="textarea"
                label="Notizen"
                value={formData.notes}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                &gt;&gt; [ERROR]: {error}
              </p>
            )}

            {success && (
              <p className="mt-3 text-sm text-brand-neon" role="status">
                {SUCCESS_MESSAGE}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 rounded-md border border-brand-neon/40 bg-brand-neon/10 px-4 py-2 font-mono text-sm font-semibold text-brand-neon transition-colors hover:bg-brand-neon/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Wird gespeichert…" : "Update senden"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Admin-Panel schließen" : "Admin-Panel öffnen"}
        className="rounded-md p-1.5 text-white/20 transition-colors hover:text-white/50"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </button>
    </div>
  );
}

interface FieldProps {
  name: keyof AvailabilityFormData;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  as?: "input" | "textarea";
}

function Field({
  name,
  label,
  value,
  onChange,
  required = false,
  type = "text",
  placeholder,
  autoComplete,
  as = "input",
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`admin-${name}`} className="text-[10px] uppercase tracking-wide text-white/45">
        {label} {required && <span className="text-brand-neon">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          id={`admin-${name}`}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={3}
          className={`${INPUT_CLASSNAME} resize-none`}
        />
      ) : (
        <input
          id={`admin-${name}`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={INPUT_CLASSNAME}
        />
      )}
    </div>
  );
}
