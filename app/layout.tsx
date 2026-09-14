import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AmbientBackground } from "@/components/chat/AmbientBackground";
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
  title: "Aziz — AI Portfolio",
  description: "Ask questions about Aziz instead of scrolling through a resume.",
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
        <AmbientBackground />
        {/* Everything real sits above the ambient layer, which is a fixed
            z-0 element behind it — see AmbientBackground's own comment for
            why a positive z-index here is more reliable cross-browser than
            a negative one on the background itself. */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
