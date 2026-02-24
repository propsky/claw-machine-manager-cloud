import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
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
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
