// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  output: "server",

  adapter: cloudflare(),

  session: false,

  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
      prefixDefaultLocale: true,
    },
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: "Syne",
      cssVariable: "--font-display",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Syne-SemiBold.woff2"],
            weight: "600",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/Syne-Bold.woff2"],
            weight: "700",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/Syne-ExtraBold.woff2"],
            weight: "800",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-body",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Inter-Regular.woff2"],
            weight: "400",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/Inter-Medium.woff2"],
            weight: "500",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/Inter-SemiBold.woff2"],
            weight: "600",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/Inter-Bold.woff2"],
            weight: "700",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Space Mono",
      cssVariable: "--font-mono",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/SpaceMono-Regular.woff2"],
            weight: "400",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/SpaceMono-Bold.woff2"],
            weight: "700",
            style: "normal",
          },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'drizzle-orm',
        'zod',
        'astro/assets/services/noop',
        'astro/logger/json',
        'astro/actions/runtime/entrypoints/server.js',
        'astro/zod',
        '@astrojs/cloudflare/handler',
      ],
    },
    server: {
      watch: {
        ignored: ['**/.wrangler/**', '**/drizzle/**'],
      },
    },
  },

  integrations: [svelte()],
});