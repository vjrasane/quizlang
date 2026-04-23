import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  site: isProd ? "https://vjrasane.github.io" : undefined,
  base: isProd ? "/quizlang" : undefined,
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fi"],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
