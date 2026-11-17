import type { MetadataRoute } from "next";

/** Installable web app: name, colours and the icon set from brand/web. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeterProof",
    short_name: "MeterProof",
    description: "Fight estimated municipal bills with evidence.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F8F4F1",
    theme_color: "#F6F3F0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
