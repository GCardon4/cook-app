import type { MetadataRoute } from "next";

// Manifiesto de la PWA con metadatos de instalación para Android e iOS
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kitchen Logix Inventario de Cocinas",
    short_name: "Cook-App",
    description: "Sistema de gestión de inventario para cocinas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#001623",
    theme_color: "#001623",
    categories: ["cooking", "inventory"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}