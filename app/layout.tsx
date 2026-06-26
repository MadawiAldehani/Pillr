import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pillr — AI Companion for Pharmacists",
  description: "Clinical AI companion for pharmacists in Kuwait",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
