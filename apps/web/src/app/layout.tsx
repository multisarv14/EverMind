import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EverMind",
  description: "Autonomous AI Executive",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
