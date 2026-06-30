import type { MetadataRoute } from "next";

// Web app manifest — required for installable PWA + iOS Web Push (16.4+)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pillr — AI Companion for Pharmacists",
    short_name: "Pillr",
    description: "Clinical AI companion for pharmacists in Kuwait",
    start_url: "/",
    display: "standalone",
    background_color: "#0F2438",
    theme_color: "#0F2438",
    icons: [
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "32x32", type: "image/png" },
    ],
  };
}
