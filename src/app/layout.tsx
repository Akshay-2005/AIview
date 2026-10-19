import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AIview — Powered by PrepPilot Engine",
  description:
    "AI-powered mock interview platform for engineering students. Real-time WPM tracking, STAR structure coaching, empathy scaffolding, and fault-tolerant edge AI.",
  keywords: ["AI interview", "mock interview", "PrepPilot", "engineering placement"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
