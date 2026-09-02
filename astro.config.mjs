// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// El dominio real va como fallback, no solo en .env: Hostinger compila desde el
// repositorio y .env no se versiona, así que el build debe producir canonical,
// og:url y sitemap correctos aunque no haya variables definidas en el panel.
const SITE = process.env.PUBLIC_SITE_URL || 'https://lotescampestresguatape.com';

export default defineConfig({
  site: SITE,

  // El sitio sigue siendo estático: con `output: 'static'` + adaptador, Astro
  // prerenderiza TODO por defecto y solo corre en servidor las rutas que se
  // marcan con `export const prerender = false`. Hoy esa es una sola:
  // /api/lead, el endpoint del formulario.
  //
  // Hostinger corre esto como aplicación Node 22. En modo standalone el propio
  // proceso sirve también los archivos estáticos, así que el "Entry file" del
  // panel debe apuntar a dist/server/entry.mjs. Sin ese campo, Hostinger no
  // arranca proceso Node y el endpoint devuelve 404.
  output: 'static',
  adapter: node({ mode: 'standalone' }),

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
