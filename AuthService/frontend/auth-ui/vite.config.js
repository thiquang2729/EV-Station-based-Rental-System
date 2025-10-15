import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ include: "**/*.{js,jsx,ts,tsx}" })],
  resolve: {
    alias: {
      assets: path.resolve(__dirname, "src/horizon/assets"),
      components: path.resolve(__dirname, "src/horizon/components"),
      contexts: path.resolve(__dirname, "src/horizon/contexts"),
      layouts: path.resolve(__dirname, "src/horizon/layouts"),
      routes: path.resolve(__dirname, "src/horizon/routes.jsx"),
      theme: path.resolve(__dirname, "src/horizon/theme"),
      variables: path.resolve(__dirname, "src/horizon/variables"),
      views: path.resolve(__dirname, "src/horizon/views"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});

