import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(import.meta.dirname, "demo"),
  publicDir: resolve(import.meta.dirname, "demo/public"),
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    outDir: resolve(import.meta.dirname, "demo/dist"),
    emptyOutDir: true,
  },
});
