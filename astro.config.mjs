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
  // Y YA NO HACE FALTA: el formulario entrega el lead con un POST desde el
  // navegador a un webhook de n8n, que es quien reenvía al CRM y quien guarda
  // las credenciales. El sitio no necesita servidor propio para nada.
  // Ver README → "Entrega de leads".
  output: 'static',

  // 'directory' genera /gracias/index.html, que es lo que Apache/LiteSpeed sirve sin config extra.
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },

  integrations: [
    // Islas React solo donde hay estado real (formulario, lightbox, calculadora, filtro, menú móvil).
    react(),
    // Fuera del sitemap: /gracias (lleva noindex) y la política de datos.
    //
    // La política se excluye SIEMPRE, no solo mientras es borrador. Es un
    // documento legal, no contenido que deba competir en búsquedas, y mientras
    // esté incompleta va con noindex: anunciarla en el sitemap y prohibir su
    // indexación en la misma página es contradecirse. Cuando se publique seguirá
    // siendo alcanzable —y por tanto indexable— desde el enlace del footer.
    sitemap({
      filter: (page) =>
        !page.includes('/gracias') && !page.includes('/politica-de-tratamiento-de-datos'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  prefetch: false,
});
