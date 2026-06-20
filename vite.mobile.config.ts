import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Static SPA build for Capacitor / Android.
// Uses the project-root index.html and src/main.tsx as entry,
// emitting to dist/client so `npx cap sync android` picks it up.
export default defineConfig({
  root: ".",
  publicDir: "public",
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    react(),
  ],
  build: {
    outDir: "dist/client",
    emptyOutDir: false,
    rollupOptions: {
      input: "index.html",
    },
  },
});
