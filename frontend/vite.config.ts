import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url' // Required for stable path resolution

// https://vitejs.dev/config/
export default defineConfig({
  // This ensures assets load correctly on github.io/kiraya-pro/
  base: '/kiraya-pro/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Kiraya Pro',
        short_name: 'Kiraya Pro',
        description: 'Property Management Simplified',
        theme_color: '#1d4ed8',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png', // Removed leading slash for better PWA pathing
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
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
