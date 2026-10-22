import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { NavLink } from '@/components/NavLink';
import { ChatDock } from '@/components/chat/ChatDock';
import { Providers } from './providers';
import "./globals.css";

// Generic product branding on purpose. "VoltAmp" was a placeholder carried over
// from the original clone and means nothing to a patient; until there is a real
// brand this is simply a clinical trial search tool, and saying so is clearer
// than an invented name.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinical Trials — Find a study",
  description:
    "Search 600,000+ registered clinical trials by condition, phase, and location, and check which ones you may qualify for.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <header className="border-b border-line bg-surface">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="inline-block h-6 w-6 rounded-md bg-accent" aria-hidden />
                <span className="text-[15px] font-semibold tracking-tight text-ink">
                  Clinical Trials
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <NavLink href="/trials">Search trials</NavLink>
                <NavLink href="/match">Relevant studies</NavLink>
              </div>
            </nav>
          </header>
          {children}
          {/* The assistant opens here, as a popup, on every page but /chat. */}
          <ChatDock />
        </Providers>
      </body>
    </html>
  );
}
