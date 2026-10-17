import type { MetadataRoute } from "next";

/** Lets phones install the site as an app with the AquaVision icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AquaVision AI",
    short_name: "AquaVision",
    description: "Оценка загрязнения воды по фотографии",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#05070c",
    theme_color: "#05070c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
