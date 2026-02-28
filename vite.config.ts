import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/og-image.png'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: '纖記 Slimly',
        short_name: 'Slimly',
        description: '台灣人的處方減重藥物追蹤工具',
        theme_color: '#8FBCB0',
        background_color: '#F8F5F0',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
