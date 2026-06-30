import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pillr — AI Companion for Pharmacists",
  description: "Clinical AI companion for pharmacists in Kuwait",

  // ── iPhone / Android home-screen (Add to Home Screen) ──────────────────
  // Short name shown under the icon — iOS truncates anything over ~12 chars
  appleWebApp: {
    capable: true,           // removes Safari chrome in standalone mode
    title: "Pillr",          // shown under the home-screen icon
    statusBarStyle: "default",
  },
};

// Without this, mobile browsers render at 980 px and never trigger media queries
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F2438",
};

// Runs before first paint so the saved theme is applied with no white flash
const NO_FLASH_THEME = `(function(){try{var t=localStorage.getItem('pillr_theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME }} />
        {children}
      </body>
    </html>
  );
}
