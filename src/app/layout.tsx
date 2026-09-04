import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Saira } from "next/font/google";
import "./globals.css";

const saira = Saira({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-saira", display: "swap" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex", display: "swap" });
const jet = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jet", display: "swap" });

export const metadata: Metadata = {
  title: "Lesson Factory Studio",
  description: "Private authoring studio for AERO avionics lessons",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${saira.variable} ${plex.variable} ${jet.variable} dark`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
