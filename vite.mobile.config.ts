import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    react(),
  ],
  build: {
    outDir: "dist/client",
    emptyOutDir: false,
    rollupOptions: {
      input: "mobile/index.html",
    },
  },
});