import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    copyPublicDir: false,
    lib: { entry: resolve(import.meta.dirname, 'src/lib/index.ts'), name: 'ModernReactTable', formats: ['es', 'cjs'], fileName: (format) => `modern-react-table.${format === 'es' ? 'js' : 'cjs'}` },
    rollupOptions: { external: ['react', 'react/jsx-runtime', 'lucide-react', '@jzarache/tooltip-react'], output: { globals: { react: 'React', 'lucide-react': 'LucideReact', '@jzarache/tooltip-react': 'TooltipReact' } } },
  },
})
