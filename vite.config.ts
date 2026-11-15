import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O front roda as regras de shared/ no navegador (Opção A).
// GitHub Pages serve o site em /NasaSpaceAppsChallenge2026/; as rotas usam HashRouter, então recarregar a página funciona.
export default defineConfig({
  base: '/NasaSpaceAppsChallenge2026/',
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      // Bibliotecas em pedaços separados: o app fica abaixo do aviso de 500 kB por arquivo.
      output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], charts: ['recharts'], motion: ['framer-motion'] } },
    },
  },
});
