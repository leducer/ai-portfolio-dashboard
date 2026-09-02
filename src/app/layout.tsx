import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Canh Viet-Duc da Silva Le | Senior Frontend Engineer // AI Interface",
  description:
    "Entdecke das interaktive, KI-gesteuerte Portfolio-Dashboard von Duc da Silva Le. Erfahre mehr über 6+ Jahre Senior-Erfahrung mit React, Next.js und AI-native Architekturen via Live-Chat und Voice-Interface.",
  keywords: [
    "Senior Frontend Entwickler",
    "React Experte",
    "Next.js",
    "TypeScript",
    "Köln",
    "Freelancer",
    "AI-native Web Apps",
    "Duc da Silva Le",
  ],
  metadataBase: new URL("https://leducer.space"),
  openGraph: {
    title: "Canh Viet-Duc da Silva Le | Senior Frontend Engineer",
    description:
      "Interaktives KI-Dashboard & Open-Source Pattern Library. Teste den autonomen Recruiter-Agenten live!",
    url: "https://leducer.space",
    siteName: "leducer.space",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "https://leducer.space",
        width: 1200,
        height: 630,
        alt: "Canh Le Senior Frontend AI Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Canh Viet-Duc da Silva Le | Senior Frontend Engineer",
    description: "Interaktives KI-Dashboard mit Sprachsteuerung und Serverless Caching.",
    images: ["https://leducer.space"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
