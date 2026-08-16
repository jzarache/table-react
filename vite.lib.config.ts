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
      name: "TableReact",
      formats: ["es", "cjs"],
      cssFileName: "table-react",
      fileName: (format) => `table-react.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react/compiler-runtime",
        "react/jsx-runtime",
        "@jzarache/tooltip-react",
      ],
      output: {
        assetFileNames: "table-react[extname]",
        globals: {
          react: "React",
          "@jzarache/tooltip-react": "TooltipReact",
        },
      },
    },
  },
});
