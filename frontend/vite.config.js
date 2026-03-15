import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeBasePath(input) {
  const basePath = (input || '/').trim();
  if (!basePath || basePath === '/') return '/';
  const prefixed = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return prefixed.endsWith('/') ? prefixed : `${prefixed}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBasePath = normalizeBasePath(env.VITE_APP_BASE_PATH || '/');
  const apiTarget = (env.VITE_API_URL || '').trim() || 'http://localhost:4000';

  return {
    plugins: [react()],
    base: appBasePath,
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
