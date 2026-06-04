import type { MetadataRoute } from "next";

// Manifiesto de la PWA con metadatos de instalación para Android e iOS
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PROACTIVO — Gestión de Cocinas",
    short_name: "PROACTIVO",
    description: "Sistema de gestión de inventario de utensilios para cocinas industriales.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#009FE3",
    categories: ["cooking", "inventory"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
