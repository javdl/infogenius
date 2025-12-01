import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    // Read directly from process.env (set by Docker ENV during build)
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    // Validate key exists at build time
    if (!apiKey) {
      console.error('ERROR: No API key found. Set GEMINI_API_KEY environment variable.');
      process.exit(1);
    }

    console.log('Building with API key:', apiKey.substring(0, 10) + '...');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
