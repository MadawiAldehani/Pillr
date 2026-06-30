import { PillrApp } from "@/app/components/PillrApp";

// The app is a fully client-side SPA that initialises Supabase at render.
// Render on-demand instead of statically prerendering at build time, so the
// build never depends on Supabase env vars being present during prerender.
export const dynamic = "force-dynamic";

export default function Home() {
  return <PillrApp />;
}
