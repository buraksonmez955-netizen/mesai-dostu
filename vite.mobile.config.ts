import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  root: "mobile",
  publicDir: "../public",
  plugins: [
    tsConfigPaths({ projects: ["../tsconfig.json"] }),
    tailwindcss(),
    react(),
  ],
  build: {
    outDir: "../dist/client",
    emptyOutDir: false,
    rollupOptions: {
      input: "index.html",
    },
  },
});