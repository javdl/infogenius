import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on mode in the current working directory
    const env = loadEnv(mode, process.cwd(), '');
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('ERROR: GEMINI_API_KEY not found. Set it in .env.local file.');
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
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
