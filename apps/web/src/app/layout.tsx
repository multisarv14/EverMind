import "./globals.css";
import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "EverMind — Your AI Executive", template: "%s · EverMind" },
  description:
    "EverMind is an AI Executive for founders and CEOs. Share a goal and it understands, plans, decides and drafts the work. Free to start.",
  openGraph: {
    title: "EverMind — Your AI Executive",
    description: "Share a goal. EverMind plans it, recommends the decision and drafts the work.",
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
