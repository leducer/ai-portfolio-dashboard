"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface JobInquiryFormData {
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  message: string;
  tech_stack: string;
  salary_range: string;
}

const INITIAL_FORM_DATA: JobInquiryFormData = {
  company: "",
  contact_name: "",
  email: "",
  phone: "",
  message: "",
  tech_stack: "",
  salary_range: "",
};

type RequiredField = Exclude<keyof JobInquiryFormData, "salary_range" | "company">;

const REQUIRED_FIELDS: RequiredField[] = [
  "contact_name",
  "email",
  "phone",
  "message",
  "tech_stack",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_LABELS: Record<keyof JobInquiryFormData, string> = {
  company: "Firma",
  contact_name: "Name",
  email: "E-Mail",
  phone: "Telefonnummer",
  message: "Nachricht / Projektbeschreibung",
  tech_stack: "Tech Stack",
  salary_range: "Gehaltsrahmen",
};

const SUCCESS_MESSAGE =
  ">> [SUCCESS]: Datenübertragung verschlüsselt an Canh gesendet. Ich melde mich in Kürze.";

const INPUT_CLASSNAME =
  "rounded-md border border-white/10 bg-brand-black/40 px-3 py-2 font-mono text-sm text-white " +
  "outline-none transition-colors placeholder:text-white/30 " +
  "focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/20";

function validate(data: JobInquiryFormData): Partial<Record<keyof JobInquiryFormData, string>> {
  const errors: Partial<Record<keyof JobInquiryFormData, string>> = {};

  for (const field of REQUIRED_FIELDS) {
    if (!data[field].trim()) {
      errors[field] = `${FIELD_LABELS[field]} ist ein Pflichtfeld.`;
    }
  }

  if (data.email.trim() && !EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Bitte eine gültige E-Mail-Adresse angeben.";
  }

  return errors;
}

export default function JobForm() {
  const [formData, setFormData] = useState<JobInquiryFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof JobInquiryFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          company: formData.company.trim() || undefined,
          salary_range: formData.salary_range.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Anfrage konnte nicht gesendet werden.");
      }

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unerwarteter Fehler beim Senden der Anfrage."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-lg rounded-lg border border-brand-neon/20 bg-brand-dark/80 p-6 font-mono shadow-[0_0_60px_10px_var(--color-brand-glow)] backdrop-blur-md"
    >
      <p className="mb-4 text-xs uppercase tracking-widest text-white/40">
        // Projekt- &amp; Job-Anfrage
      </p>

      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-start gap-2 py-8"
          >
            <p className="text-sm leading-relaxed text-brand-neon">
              {SUCCESS_MESSAGE}
              <span
                aria-hidden="true"
                className="ml-1 inline-block h-4 w-[0.5ch] -translate-y-0.5 animate-blink bg-brand-neon align-middle"
              />
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <Field
              name="company"
              label={`${FIELD_LABELS.company} (optional)`}
              value={formData.company}
              onChange={handleChange}
              error={errors.company}
            />
            <Field
              name="contact_name"
              label={FIELD_LABELS.contact_name}
              value={formData.contact_name}
              onChange={handleChange}
              error={errors.contact_name}
              required
            />
            <Field
              name="email"
              type="email"
              label={FIELD_LABELS.email}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Field
              name="phone"
              type="tel"
              label={FIELD_LABELS.phone}
              placeholder="z.B. +49 170 1234567"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
            />
            <Field
              name="tech_stack"
              label={FIELD_LABELS.tech_stack}
              placeholder="z.B. React, Next.js, PostgreSQL"
              value={formData.tech_stack}
              onChange={handleChange}
              error={errors.tech_stack}
              required
            />
            <Field
              name="message"
              as="textarea"
              label={FIELD_LABELS.message}
              value={formData.message}
              onChange={handleChange}
              error={errors.message}
              required
            />
            <Field
              name="salary_range"
              label={`${FIELD_LABELS.salary_range} (optional)`}
              placeholder="z.B. 80.000 – 95.000 €"
              value={formData.salary_range}
              onChange={handleChange}
            />

            {submitError && (
              <p className="text-sm text-red-400" role="alert">
                &gt;&gt; [ERROR]: {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-md border border-brand-neon/40 bg-brand-neon/10 px-4 py-2 font-mono text-sm font-semibold text-brand-neon transition-colors hover:bg-brand-neon/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Wird gesendet…" : "Anfrage senden"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface FieldProps {
  name: keyof JobInquiryFormData;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  as?: "input" | "textarea";
}

function Field({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  type = "text",
  placeholder,
  as = "input",
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs uppercase tracking-wide text-white/50">
        {label} {required && <span className="text-brand-neon">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
          className={`${INPUT_CLASSNAME} resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={INPUT_CLASSNAME}
        />
      )}
      {error && (
        <span className="text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
