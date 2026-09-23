import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EzPz — Local services, booked the easy way",
    short_name: "EzPz",
    description:
      "A modern, trustworthy services marketplace for Guyana. Verified sellers, in-app messaging, and direct MMG payments.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0609",
    theme_color: "#0a0609",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
