import type { Metadata } from "next";
import "./globals.css";
import { withBase } from "@/lib/base-path";

// Fonts are loaded via a stylesheet link (not next/font) so builds do not depend on fetching Google
// Fonts at compile time. CSS variables are defined in globals.css.
const FONTS = "https://fonts.googleapis.com/css2?family=Saira:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

export const metadata: Metadata = {
  title: "Lesson Factory Studio",
  description: "Private authoring studio for AERO avionics lessons",
  icons: { icon: withBase("/favicon.svg") },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
