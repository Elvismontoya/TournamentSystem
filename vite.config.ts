import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      // In development the API (TournamentSystem-backend) is reached as /api, so the app can
      // use relative URLs. API_PROXY_TARGET changes where it points (default: port 3000).
      proxy: { '/api': env.API_PROXY_TARGET || 'http://localhost:3000' },
    },
  };
});
