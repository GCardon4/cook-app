import type { MetadataRoute } from "next";

// Manifiesto de la PWA con metadatos de instalación para Android e iOS
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KitchenLogix — Inventario de Cocinas",
    short_name: "KitchenLogix",
    description: "Sistema de gestión de inventario para cocinas industriales.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#001623",
    theme_color: "#001623",
    categories: ["cooking", "inventory"],
    icons: [
      // PNG requeridos por Chrome Android para mostrar el prompt de instalación
      {
        src: "/icon/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      // SVG como fallback
      {
        src: "/icon/icon-app.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
