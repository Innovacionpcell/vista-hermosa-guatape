// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// El dominio real va como fallback, no solo en .env: Hostinger compila desde el
// repositorio y .env no se versiona, así que el build debe producir canonical,
// og:url y sitemap correctos aunque no haya variables definidas en el panel.
const SITE = process.env.PUBLIC_SITE_URL || 'https://lotescampestresguatape.com';

export default defineConfig({
  site: SITE,

  // 100 % estático, SIN adaptador. El build deja index.html en la raíz de
  // dist/, que es donde apunta el docroot de Hostinger.
  //
  // POR QUÉ NO HAY ADAPTADOR (leer antes de volver a añadirlo):
  // Al añadir @astrojs/node, Astro parte la salida en dist/client/ y
  // dist/server/. El docroot del panel sigue siendo dist/, que se queda sin
  // index.html → 403 Forbidden en toda la web, y de paso dist/server/ queda
  // descargable por HTTP. Eso tumbó producción.
  //
  // Para activar el backend Node hacen falta LAS DOS COSAS, en este orden:
  //   1. En hPanel, rellenar "Entry file" = dist/server/entry.mjs
  //      (y comprobar que el proceso arranca y responde).
  //   2. Solo entonces: volver a poner el adapter aquí y mover
  //      src/server/lead-endpoint.ts a src/pages/api/lead.ts
  // Ver README → "Backend del formulario".
  output: 'static',

  // 'directory' genera /gracias/index.html, que es lo que Apache/LiteSpeed sirve sin config extra.
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },

  integrations: [
    // Islas React solo donde hay estado real (formulario, lightbox, calculadora, filtro, menú móvil).
    react(),
    // /gracias lleva noindex, así que no entra al sitemap.
    sitemap({
      filter: (page) => !page.includes('/gracias'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  prefetch: false,
});
