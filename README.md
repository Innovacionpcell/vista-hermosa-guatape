# Lotes Campestres Vista Hermosa — Guatapé

Landing de una sola ruta para la venta de lotes campestres en el sector Vista Hermosa,
a 15 minutos de Guatapé (Antioquia). Objetivo único: **captar leads calificados por
formulario y WhatsApp**.

- **Stack:** Astro 5 (`output: 'static'`) · Tailwind CSS 4 · islas React puntuales
- **Hosting:** Hostinger compartido — sin Node en producción
- **Backend del formulario:** un único `public/api/lead.php` que hace de proxy al CRM

> **La unidad comercial es el metro cuadrado.** El sitio nunca presenta un precio total
> como cifra principal: comunica el valor por m² (desde $45.000, promedio $80.000) y el
> visitante estima su total con la calculadora. Cualquier cambio debe respetar esa regla.

---

## Desarrollo local

```bash
npm install     # requiere Node 20 o superior
npm run dev     # http://localhost:4321
npm run build   # genera dist/
npm run preview # sirve dist/ para revisarlo antes de desplegar
```

Copia `.env.example` a `.env` y rellena lo que necesites. `.env` **nunca** se commitea.

**PHP no corre en `astro dev`.** El formulario apunta a `/api/lead.php`, que solo existe
como archivo estático en local. Para probarlo de verdad hace falta un servidor con PHP
(o desplegar a un subdominio de pruebas en Hostinger). Ver *Probar el formulario* abajo.

---

## Estructura

```
public/
  img/          assets ya optimizados (WebP, 3 tamaños, nombres SEO) — NO recomprimir ni renombrar
  fonts/        Cormorant Garamond + Inter, variables, subset latin, self-hosted
  api/lead.php  proxy servidor→servidor al webhook del CRM
  .htaccess     HTTPS, sin www, compresión, caché — Astro lo copia a dist/
  robots.txt
src/
  components/   una sección por componente
  data/         proyecto.ts · lotes.ts · galeria.ts · faq.ts — toda la data de negocio
  layouts/      BaseLayout.astro — head SEO completo y JSON-LD
  pages/        index.astro · gracias.astro · 404.astro
  styles/       global.css — tokens de marca y @font-face
```

**Ningún texto de negocio se escribe dentro de un componente**: todo vive en `src/data/*.ts`.

---

## Despliegue

**Producción:** https://lotescampestresguatape.com

Hostinger está configurado con **Node 22**, importando este repositorio de GitHub
directamente y ejecutando el build en cada `push`. No hay que hacer nada más: se empuja a
`main` y el sitio se reconstruye solo.

```bash
git push origin main   # eso es todo el despliegue
```

No hay workflow de GitHub Actions ni subida por FTP: Hostinger compila. Por eso el
dominio real está como **fallback en `astro.config.mjs`** y no solo en `.env` — `.env` no
se versiona, así que el build en el servidor debe producir `canonical`, `og:url` y
`sitemap.xml` correctos aunque no haya ninguna variable definida en el panel.

Si en algún momento quieres apuntar a un entorno de pruebas, define `PUBLIC_SITE_URL` en
las variables de entorno de hPanel; el fallback solo aplica cuando la variable no existe.

### Deploy manual de emergencia

Si el build automático falla y hay que publicar ya:

```bash
npm ci
npm run build
```

Y subir el **contenido** de `dist/` (no la carpeta) por el Administrador de archivos de
hPanel. El administrador oculta los archivos que empiezan por punto hasta que se activa
*Mostrar archivos ocultos*, así que hay que verificar a mano que `.htaccess` haya subido.

---

## ⚠️ Backend del formulario — pendiente de replantear (Etapa 6)

El brief original asumía Hostinger **compartido con PHP** y por eso especificaba un proxy
`public/api/lead.php`. **El entorno real es Node 22, así que ese archivo PHP no se va a
ejecutar.** El formulario se replantea al llegar a la Etapa 6. Opciones sobre la mesa:

1. **Endpoint de Astro con adaptador de Node** (`@astrojs/node`) — implica pasar de
   `output: 'static'` a `output: 'hybrid'` con la home prerenderizada y solo la ruta del
   formulario en servidor. Mantiene todo en el mismo repositorio y el secreto del CRM
   nunca llega al navegador. Es la opción por defecto.
2. **POST directo del navegador al webhook del CRM** — descartada salvo que el CRM
   ofrezca un endpoint público pensado para eso: expondría la URL del webhook y lo dejaría
   abierto a spam.
3. **Servicio externo de formularios** — más simple, pero mete un tercero en la ruta del
   lead y complica el payload con UTMs.

**Consecuencia adicional a verificar:** con hosting Node, el `public/.htaccess` puede ser
**inerte** — si el sitio no lo sirve Apache/LiteSpeed, se pierden la redirección a HTTPS,
el `sin www`, la compresión y las cabeceras de caché inmutable de `/img` y `/fonts`. Eso
afecta directamente al presupuesto de performance. Hay que comprobar en el primer deploy
si `.htaccess` surte efecto y, si no, replicar esas reglas donde corresponda.

### Cómo probar el formulario

Cuando exista, tras el primer deploy:

1. Enviar el formulario desde el sitio publicado.
2. Confirmar que el lead llegó al CRM con las UTMs completas.
3. Forzar un fallo del webhook y confirmar que el lead quedó en el respaldo y no se perdió.

---

## TODOs pendientes de confirmar con el cliente

Están marcados en el código con `// TODO`. Ninguno se inventó ni se rellenó con datos
plausibles: van visibles a propósito.

| # | Pendiente | Dónde |
|---|---|---|
| 1 | Teléfono fijo y correo de contacto | `src/data/proyecto.ts` |
| 2 | ~~Dominio definitivo~~ — resuelto: `lotescampestresguatape.com` | — |
| 3 | Razón social y NIT del vendedor | footer |
| 4 | URL del webhook del CRM y su secreto, **y decidir el mecanismo de envío** (ver arriba: el hosting es Node, no PHP) | Etapa 6 |
| 5 | Política de tratamiento de datos personales (Ley 1581 de 2012) | formulario y footer |
| 6 | **Cuáles dos lotes están vendidos.** El plano rotula 11 lotes con 2 marcados "SOLD", pero las líneas guía no permiten atribuirlos a un número con certeza. Por decisión explícita, **ningún hotspot se marca como vendido**: marcar mal un lote disponible cuesta un cliente | `src/data/lotes.ts` |
| 7 | **11 lotes en el plano vs. 10 disponibles en los datos oficiales.** Se usa 10 en todo el copy y el JSON-LD, según la regla de que las cifras del cliente mandan | `src/data/lotes.ts` |
| 8 | Área exacta y valor por m² de cada lote. Mientras no estén, **no se publica desglose lote por lote** | `src/data/lotes.ts` |
| 9 | Estado de la licencia en Planeación Municipal de Guatapé | sección Especificaciones |
| 10 | Confirmar los ítems de especificaciones no verificados (energía, agua, escrituración) | `src/data/` |
| 11 | Distancias a Medellín, al Aeropuerto JMC y a la Piedra del Peñol (estimadas, no confirmadas) | `src/data/proyecto.ts` |
| 12 | Ajustar visualmente los polígonos de los hotspots del plano | `src/data/lotes.ts` |

**Fotos del malecón de Guatapé y de la Piedra del Peñol:** no se incluyen. No consta que
sean material propio del cliente y el riesgo de derechos de autor no compensa. Si el
cliente confirma que las tiene licenciadas, se agregan después.

**Levantamiento topográfico (Consultoría YJC):** existe y sirve como respaldo técnico y
para mencionar que el proyecto está radicado en Planeación, pero **no se usa como fuente
de áreas comerciales**: su numeración es por predio y no coincide con la del brochure.

---

Desarrollado por **Growth Digital**.
