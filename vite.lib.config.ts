import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { resolve } from "node:path";
import { libInjectCss } from "vite-plugin-lib-inject-css";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    libInjectCss(),
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "ModernReactTable",
      formats: ["es", "cjs"],
      cssFileName: "react-table",
      fileName: (format) => `react-table.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react/jsx-runtime",
        "lucide-react",
        "@jzarache/tooltip-react",
      ],
      output: {
        assetFileNames: "react-table[extname]",
        globals: {
          react: "React",
          "lucide-react": "LucideReact",
          "@jzarache/tooltip-react": "TooltipReact",
        },
      },
    },
  },
});
