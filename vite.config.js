import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))

// The Base44 vite plugin used to sit here, injecting a dev-time analytics
// tracker, a visual edit agent and HMR/navigation notifiers that reported back
// to the platform this shop has left. It put nothing into the production build,
// which is why it survived the rest of the migration unnoticed.
//
// It was also, quietly, the only thing defining the `@/` import alias that every
// module in src/ uses. That is now declared here, where it belongs: a path alias
// the whole codebase depends on should not arrive as a side effect of a plugin
// nobody realised was still installed.
//
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // The shop shipped as one 970KB file, so a phone had to parse all of it
        // before the first shirt appeared. These four rarely change, so a
        // returning visitor keeps them cached while the shop's own code, the
        // part that actually changes on every deploy, is the only thing
        // downloaded again.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
