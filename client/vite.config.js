import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Servidor de juego al que Vite reenvía /socket.io y /api (por defecto el de `npm run dev`).
const API_TARGET = process.env.LINEAN_API_TARGET || 'http://localhost:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // accesible desde el celular en la misma red Wi-Fi
    port: 5173,
    proxy: {
      '/socket.io': { target: API_TARGET, ws: true },
      '/api': { target: API_TARGET },
    },
  },
  build: {
    target: ['es2020', 'safari14'],
  },
});
