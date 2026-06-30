import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Next.js needs unsafe-inline + unsafe-eval for its runtime chunks
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // React inline style={{}} props require unsafe-inline for style-src
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Avatars served from Supabase Storage
  "img-src 'self' data: blob: https://*.supabase.co https:",
  // Supabase REST + Realtime (wss), OpenRouter AI
  // HaveIBeenPwned k-anonymity API for breached-password check at sign-up
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.pwnedpasswords.com",
  // Google Fonts files
  "font-src 'self' data: https://fonts.gstatic.com",
  // Service worker for Web Push — same origin only
  "worker-src 'self'",
  // Disallow embedding in iframes (clickjacking)
  "frame-ancestors 'none'",
  // Prevent base-tag hijacking
  "base-uri 'self'",
  // Form posts only to same origin
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Clickjacking protection (legacy browsers)
  { key: "X-Frame-Options",          value: "DENY" },
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options",   value: "nosniff" },
  // Limit referrer info sent to third parties
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  // Disable browser features the app doesn't use
  { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
  // Enforce HTTPS for 2 years (only add when deployed on HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Content Security Policy
  { key: "Content-Security-Policy",  value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
