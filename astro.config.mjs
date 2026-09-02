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

  // Hostinger compartido no ejecuta Node: el sitio es 100 % estático.
  // El único backend es public/api/lead.php, que Astro copia tal cual a dist/api/lead.php.
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
