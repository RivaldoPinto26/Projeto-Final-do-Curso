import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      devOptions: {
        enabled: true,
      },
      registerType: "autoUpdate",
      manifest: {
        name: "Simple APP Lit",
        short_name: "simpleLIT",
        theme_color: "#fff",
        background_color: "#fff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});