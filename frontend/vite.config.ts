import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
        },
      },
      plugins: [react()],
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
