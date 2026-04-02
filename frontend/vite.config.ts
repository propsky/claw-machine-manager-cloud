import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['.ngrok-free.app', '.loca.lt', 'unimpacted-saliently-maura.ngrok-free.dev'],
        proxy: {
          '/api/auth': {
            target: 'https://smartpay.propskynet.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api\/auth/, '/api/users'),
          },
          '/api/store-app': {
            target: 'https://smartpay.propskynet.com',
            changeOrigin: true,
            secure: true,
          },
          '/api/smartpay': {
            target: 'https://smartpay.propskynet.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api\/smartpay/, '/api'),
          },
          '/api/favorite-bank-accounts': {
            target: 'https://smartpay.propskynet.com',
            changeOrigin: true,
            secure: true,
          },
          '/api/users': {
            target: 'https://smartpay.propskynet.com',
            changeOrigin: true,
            secure: true,
          },
          '/api/withdrawal': {
            target: 'https://smartpay.propskynet.com',
            changeOrigin: true,
            secure: true,
          },
          '/api/stores': {
            target: 'https://smartpay.propskynet.com',
            changeOrigin: true,
            secure: true,
          },
        },
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
          manifest: {
            name: 'Claw Machine Manager',
            short_name: '機台管家',
            description: '夾娃娃機台場營運監控與財務管理',
            theme_color: '#f2d00d',
            background_color: '#121212',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'pwa-64x64.png',
                sizes: '64x64',
                type: 'image/png',
              },
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: 'maskable-icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            // HashRouter: cache app shell, serve index.html for all navigation
            navigateFallback: 'index.html',
            navigateFallbackDenylist: [/^\/api\//],
            // Cache strategies
            runtimeCaching: [
              {
                // API requests: network first
                urlPattern: /^https:\/\/.*\/api\//,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
                },
              },
              {
                // Google Fonts stylesheets
                urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
                handler: 'StaleWhileRevalidate',
                options: { cacheName: 'google-fonts-stylesheets' },
              },
              {
                // Google Fonts files
                urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-webfonts',
                  expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
            ],
          },
          devOptions: {
            enabled: true,
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        __APP_VERSION__: JSON.stringify(pkg.version),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
