import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url' // Required for stable path resolution

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'favicon.svg'],
      manifest: {
        name: 'Kiraya Pro | Property Management',
        short_name: 'Kiraya Pro',
        description: 'Professional Property Management System for Landlords, Caretakers, and Tenants.',
        theme_color: '#ffffff',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png', // Removed leading slash for better PWA pathing
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // This explicitly points '@' to your 'src' directory
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
