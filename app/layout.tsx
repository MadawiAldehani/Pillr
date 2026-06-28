import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pillr — AI Companion for Pharmacists",
  description: "Clinical AI companion for pharmacists in Kuwait",
};

// Without this, mobile browsers render at 980 px and never trigger media queries
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
