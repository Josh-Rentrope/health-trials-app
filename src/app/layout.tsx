import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from './providers';
import "./globals.css";

// Clerk used to wrap this tree. It is gone: nothing on the search or map path
// needed a session, chat identity is a server-issued cookie now, and the
// `<SignedIn>` header block below was commented out anyway -- so the only thing
// Clerk still did was require two secrets to be present or the app would fail to
// render at all. The `AuthStatus` import was likewise dead (imported, never
// rendered) and pulled in a second, unused auth library.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoltAmp — Clinical Trial Search",
  description: "Find recruiting clinical trials by condition, phase, and location.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <header className="p-4 border-b">
            <nav className="flex justify-between items-center">
              <Link href="/" className="font-semibold">VoltAmp</Link>
              <div className="flex gap-6 text-sm">
                <Link href="/trials" className="text-gray-600 hover:text-blue-600">
                  Search trials
                </Link>
                <Link href="/chat" className="text-gray-600 hover:text-blue-600">
                  Ask the assistant
                </Link>
              </div>
            </nav>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
