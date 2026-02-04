import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Bumps limit to 1MB to stop noise
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split heavy dependencies into separate files
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('supabase')) return 'supabase';
            if (id.includes('react')) return 'react-vendor';
            // Remaining dependencies
            return 'vendor';
          }
        },
      },
    },
  },
})