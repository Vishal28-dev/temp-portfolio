import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Docker bind-mounts do not deliver inotify events on every host.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': { target: proxyTarget, changeOrigin: true },
      '/uploads': { target: proxyTarget, changeOrigin: true },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Three is deferred so the document paints before the scene loads.
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
