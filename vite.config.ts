import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/portafolio/',
  build: {
    // react-router + React ya rozan los 500 kB antes de minificar. Subimos el
    // umbral para que el aviso siga significando algo en vez de salir siempre.
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
