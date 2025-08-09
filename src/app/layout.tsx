import type { Metadata } from "next";

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

import { Providers } from './providers'; // Import the new provider

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthStatus } from '@/components/AuthStatus';

//import 'regenerator-runtime/runtime';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoltAmp",
  description: "Power Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <Providers>
              <header className="p-4 border-b">
                <nav className="flex justify-between">
                  <p>VoltAmp App</p>
                  <SignedOut>
                    <SignInButton />
                    <SignUpButton>
                      <button className="bg-[#6c47ff] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </nav>
              </header>
              {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
          
  );
}
