import "./globals.css";
import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "EverMind — AI That Remembers. AI That Evolves.", template: "%s · EverMind" },
  description:
    "EverMind is an AI executive team for your company. Specialist agents for strategy, finance, marketing, operations and more learn your business, remember every conversation and decision, and keep getting sharper every day. Free to start.",
  openGraph: {
    title: "EverMind — AI That Remembers. AI That Evolves.",
    description: "Your AI executive team that learns your company.",
    siteName: "EverMind",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
