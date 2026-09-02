# PROMPT PARA CLAUDE CODE — Landing "Lotes Campestres Vista Hermosa, Guatapé"

> Pegar todo este archivo como primer mensaje en Claude Code, dentro de una carpeta vacía,
> con la carpeta `public-img/` y el archivo `imagenes.json` ya copiados dentro.

---

Vas a construir una landing page de una sola ruta, en español (Colombia), para vender lotes campestres en Guatapé, Antioquia. El objetivo del sitio es **captar leads calificados por formulario y WhatsApp**, no informar. Todo lo que no empuje a esa conversión sobra.

## 1. Stack y restricciones técnicas

- **Astro 5** con `output: 'static'`. Islas React (`@astrojs/react`) SOLO donde haya estado real: formulario, lightbox de galería, acordeón de FAQ, menú móvil. Todo lo demás es HTML estático sin JS.
- **Tailwind CSS 4** vía `@tailwindcss/vite`. Nada de librerías de componentes (sin shadcn, sin MUI, sin Bootstrap).
- **Cero dependencias pesadas.** Sin framer-motion, sin swiper, sin lightbox de terceros: el lightbox lo escribes tú en ~120 líneas con `<dialog>` nativo y teclado (Esc, ←, →).
- Imágenes con el componente `<Image />` de `astro:assets` cuando sea posible; si no, `<picture>` con `srcset` manual. **Nunca** una imagen sin `alt`, `width`, `height` y `loading="lazy"` (excepto el hero: `loading="eager"` + `fetchpriority="high"`).
- Fuentes: **self-hosted** (`.woff2` en `/public/fonts`), `font-display: swap`, precargadas. Nada de Google Fonts por CDN.
- Deploy: **Hostinger hosting compartido**. El build (`dist/`) se sube por FTP/Git a `public_html`. Por eso **no puede haber SSR ni API routes de Node en producción**: el backend del formulario es un único archivo PHP (ver sección 7).
- Presupuesto de performance, no negociable: **LCP < 2.0s en 4G, CLS < 0.05, JS inicial < 60 KB gzip, peso de la primera vista < 900 KB.** Al terminar, corre `npx lighthouse` o reporta cómo verificarlo.

Estructura de carpetas:

```
/
├── public/
│   ├── img/            ← copiar aquí el contenido de public-img/
│   ├── fonts/
│   ├── api/lead.php    ← proxy del formulario
│   ├── robots.txt
│   └── sitemap.xml     (lo genera @astrojs/sitemap)
├── src/
│   ├── components/     (Hero, DatosClave, Ubicacion, Tour360, Galeria, Lotes, PorQueGuatape, Especificaciones, Faq, FormularioLead, WhatsAppFlotante, CtaSticky, Footer)
│   ├── data/           (proyecto.ts, lotes.ts, faq.ts, galeria.ts)
│   ├── layouts/BaseLayout.astro
│   ├── pages/index.astro, gracias.astro, 404.astro
│   └── styles/global.css
├── astro.config.mjs
└── .env.example
```

Toda la data (precios, áreas, textos de FAQ, ítems de galería) vive en `src/data/*.ts` tipada con TypeScript. **Ningún texto de negocio hardcodeado dentro de un componente.**

## 2. Identidad visual

Paleta extraída del logo real (no la cambies):

| Token | Hex | Uso |
|---|---|---|
| `verde-900` | `#0E1D15` | fondos profundos, footer |
| `verde-800` | `#162B1F` | **color base de marca** — fondo de secciones oscuras, header |
| `verde-700` | `#1F3D2C` | superficies elevadas, cards sobre fondo oscuro |
| `dorado-400` | `#E3CBA7` | **acento principal** — textos destacados, bordes, íconos |
| `dorado-500` | `#C8A46A` | hover de acento, líneas divisorias |
| `dorado-600` | `#A8823F` | texto dorado sobre fondos claros (contraste AA) |
| `crema` | `#F7F3EC` | fondo de secciones claras |
| `texto` | `#1A1A17` | texto sobre crema |

Reglas de diseño:

- Alterna secciones **verde-800 → crema → verde-800**. Nada de gris corporativo.
- Tipografía: una serif elegante para titulares (Cormorant Garamond o Playfair Display, en `.woff2` local) y una sans neutra para cuerpo (Inter). Titulares con `letter-spacing` amplio en versalitas para eco del logo.
- El dorado es **acento, no fondo**: úsalo en botones primarios, filetes de 1px, íconos y números. Un botón dorado con texto verde-900 es el CTA primario; el secundario es outline dorado sobre transparente.
- Detalle de marca recurrente: un filete horizontal delgado dorado con el nombre de sección centrado, igual al tratamiento de "GUATAPE" en el logo.
- Estética: campestre premium, sobria, con mucho aire. Fotografía a sangre, tipografía grande, poco texto. **No** parezca portal inmobiliario genérico.
- Modo oscuro: no implementar. Una sola paleta.
- Accesibilidad: contraste AA mínimo, `:focus-visible` dorado visible, navegación completa por teclado, `prefers-reduced-motion` respetado.

## 3. Datos reales del proyecto (usar textualmente)

**La unidad comercial es el metro cuadrado.** El proyecto no vende "lotes con precio fijo": vende m² a un valor que varía según el lote, y el comprador elige área. Todo el copy, la jerarquía visual y la calculadora giran alrededor de eso. Nunca presentes un precio total como cifra principal.

```ts
// src/data/proyecto.ts
export const proyecto = {
  nombre: "Lotes Campestres Vista Hermosa",
  ciudad: "Guatapé",
  sector: "Vista Hermosa",
  departamento: "Antioquia",
  pais: "Colombia",
  lotesDisponibles: 10,
  areaMin: 3500,           // m²
  areaMax: 10000,          // m²
  precioM2Min: 45000,      // COP — lote de menor valor
  precioM2Max: 100000,     // COP
  precioM2Promedio: 80000, // COP — cifra de referencia comercial
  tiempoAGuatape: "15 minutos",   // dato del brochure oficial
  coordenadas: { lat: 6.210427, lng: -75.155184 },
  googleMaps: "https://maps.app.goo.gl/MdV9hd78RU64HLUR7",
  tour360: "https://tour.panoee.net/6a8c990e2745174f948f54f8/dji_0533",
  whatsapp: "573105145648",
  whatsappDisplay: "310 514 5648",
  desarrolla: "R&U Ingenieros",
  telefono: "PENDIENTE",
  email: "PENDIENTE",
  dominio: "https://PENDIENTE.com"
};
```

Los campos `PENDIENTE` van visibles con `// TODO: confirmar antes de publicar`. **No inventes teléfonos, correos, NIT ni razón social.**

Reglas duras sobre contenido:

- Las cifras de arriba son las **oficiales del cliente** y mandan sobre cualquier otra fuente. No las cruces con las áreas del levantamiento topográfico ni las recalcules.
- **No publiques una tabla de precios totales lote por lote.** Ese desglose no existe todavía y presentarlo a medias mata la credibilidad. El precio se comunica como **valor por m²** (desde $45.000/m², promedio $80.000/m²) y el total lo estima el visitante con la calculadora de la sección 7.
- Formatea siempre en COP con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })` y escribe la unidad como `m²` (entidad `&sup2;`), nunca "m2".
- Ubicación: **a 15 minutos de Guatapé**, sector Vista Hermosa, con vista al embalse y a la Piedra del Peñol. Puedes añadir "≈2,8 km en línea recta a la Piedra del Peñol" marcado con TODO (cálculo desde la coordenada). Tiempos desde Medellín (~1h20) y desde el Aeropuerto José María Córdova (~50 min), también con TODO.
- **Prohibido** prometer rentabilidad, valorización garantizada, cifras de retorno o "inversión segura". Es publicidad inmobiliaria en Colombia: se habla de atributos del lote y del entorno, no de rendimientos.
- Incluye en el footer la nota legal: las imágenes de render son ilustrativas y no constituyen oferta comercial; áreas y valores sujetos a disponibilidad y a verificación en el levantamiento topográfico.

## 4. Estructura de la página (orden exacto)

1. **Header** transparente sobre el hero, sólido `verde-800` al hacer scroll. Logo dorado a la izquierda, 4 anclas (Ubicación, Recorrido 360°, Lotes, Contacto) y botón WhatsApp. En móvil: logo + botón WhatsApp, menú hamburguesa.
2. **Hero** a pantalla completa (`100svh`, no `100vh`). Fondo: `fotos/vista-embalse-guatape-piedra-del-penol-desde-lotes` con degradado `verde-900/70 → transparente`.
   - H1: **Lotes campestres en Guatapé con vista al embalse y a la Piedra del Peñol**
   - Subtítulo: 10 lotes disponibles, áreas desde 3.500 m² hasta 10.000 m², a 15 minutos de Guatapé.
   - Dos CTA: "Ver lotes disponibles" (dorado) y "Recorrido virtual 360°" (outline).
   - Cifra ancla en dorado, grande, junto al CTA: **desde $45.000/m²**. Micro-señal de escasez honesta: "Solo quedan 10 lotes disponibles."
3. **Barra de datos clave** (fondo crema, 4 columnas → 2 en móvil): 10 lotes disponibles · áreas de 3.500 a 10.000 m² · desde $45.000/m² · a 15 minutos de Guatapé. Iconos SVG inline, no librería. El valor por m² es la cifra dominante de la barra.
4. **Ubicación**: dos columnas. Izquierda: texto + lista de distancias con íconos. Derecha: mapa de Google embebido con **facade** (imagen estática + botón "Cargar mapa"; el iframe solo se inyecta al hacer clic — no cargues Google Maps en el load inicial). Botón "Abrir en Google Maps" con el link real y coordenadas visibles copiables.
5. **Recorrido virtual 360°** — sección de ancho completo sobre `verde-800`. Igual que el mapa: **facade** con una de las panorámicas equirectangulares de `/img/pano/` + play dorado. Al clic, se inyecta `<iframe src="{tour360}" allowfullscreen loading="lazy" title="Recorrido virtual 360° de los Lotes Campestres Vista Hermosa en Guatapé">` en ratio 16:9. Dispara evento `tour_360_abierto` a dataLayer.
6. **Galería tipo clúster** — la pieza visual fuerte:
   - Grid CSS asimétrico (mosaico): las imágenes con `"destacada": true` ocupan 2×2, el resto 1×1. En móvil: dos columnas tipo masonry.
   - Filtros por grupo: **Fotografía real / Renders del proyecto**. El filtro es CSS puro con `:has()` o un island React mínimo; nunca recarga.
   - Cada tile lleva su `caption` visible al hover (desktop) y siempre visible en móvil. El sello "Render ilustrativo" va sobre cada render.
   - Lightbox propio: `<dialog>`, navegación por teclado y swipe, `alt` heredado del manifiesto, sin scroll-lock roto.
   - Consume `src/data/galeria.ts`, generado a partir de `imagenes.json` (respeta `alt` y `caption` tal cual están, son SEO).
7. **Lotes y valor por m²** — la sección que convierte. Tres partes:

   **7a. Plano interactivo.** Muestra `renders/plano-lotes-vista-hermosa-guatape` (render aéreo del predio con los lotes numerados). Encima, un `<svg>` superpuesto en `position:absolute` con `viewBox` proporcional y un botón transparente por lote. Hover/tap: se resalta con relleno `dorado-400/25` y borde dorado, y aparece un tooltip con el número y el estado. Clic: scroll suave a la calculadora y precarga `lote_interes`. Los lotes ya vendidos (marcados "SOLD" en el plano original) van en gris, `cursor: not-allowed`, etiqueta "Vendido". En móvil el plano es pinch-zoomable. Los polígonos van en `src/data/lotes.ts` como `hotspot: "x1,y1 x2,y2 ..."` con un TODO para ajustarlos visualmente — la primera pasada quedará aproximada y está bien.
   **No muestres área ni precio por lote en el tooltip:** ese desglose no está confirmado.

   **7b. Bandas de área.** Tres cards limpias, sin precio total: `3.500 – 5.000 m²`, `5.000 – 7.500 m²`, `7.500 – 10.000 m²`. Cada una con una frase de uso ("ideal para casa campestre", "para casa y huerta", "para finca de recreo con amplio retiro") y un botón que abre el formulario con el campo `area_interes` precargado.

   **7c. Calculadora de inversión** (island React, la pieza estrella):
   - Slider de área de 3.500 a 10.000 m², paso 100, con input numérico sincronizado.
   - Selector de valor por m²: `$45.000 (desde)` / `$80.000 (promedio)` / `$100.000 (máximo)`, con el promedio preseleccionado. También permite escribir un valor propio dentro del rango.
   - Resultado grande en dorado sobre `verde-800`, animado con `Intl.NumberFormat`: `10.000 m² × $80.000/m² = $800.000.000`. Debajo, en pequeño: "Valor estimado. El valor por m² varía según el lote y su ubicación dentro del proyecto."
   - CTA bajo el resultado: **"Cotizar este lote"** → precarga en el formulario `area_interes` y `presupuesto_estimado` con lo que el usuario configuró y hace scroll. Dispara `calculadora_usada` con los valores.
   - Sin recálculo en servidor, sin dependencias: `useState` y `useMemo`.

   Esta calculadora es la mejor herramienta de calificación que tiene la página: el lead llega al CRM con área y presupuesto ya definidos por él mismo.
8. **Por qué Guatapé**: 3 bloques cortos sobre entorno (embalse, Piedra del Peñol, turismo consolidado, cercanía a Medellín y al Aeropuerto JMC). Atributos del lugar, **cero promesas de retorno**.
9. **Especificaciones**: lista con íconos — vía de acceso vehicular hasta el lote, energía, agua, topografía apta para construcción, bosque nativo conservado, escrituración individual, proyecto radicado en Planeación Municipal de Guatapé. Marca con TODO los ítems que no estén confirmados por el cliente.
10. **Formulario de lead** (sección ancla `#contacto`, fondo `verde-800`): ver sección 7.
11. **FAQ** en acordeón accesible (`<details>` nativo estilizado): 8 preguntas orientadas a búsquedas reales — cuánto cuesta el metro cuadrado en Guatapé, cuál es el área mínima, se puede construir, se puede escriturar, cómo llegar desde Medellín, hay servicios públicos, se acepta financiación, cómo agendar una visita. Alimenta el schema `FAQPage`.
12. **Footer** `verde-900`: logo, coordenadas, links, nota legal, aviso de tratamiento de datos, y crédito **"Desarrollado por Growth Digital"** enlazando a growthdigital (link normal, sin `nofollow`).
13. **WhatsApp flotante** — pieza de marca, no el widget verde genérico:
    - Botón circular de 60 px (56 en móvil), fondo `verde-800` con borde de 1,5 px `dorado-500` y sombra suave; el glifo de WhatsApp va en `dorado-400`, **dibujado como `<svg>` inline propio** (path del ícono, `fill="currentColor"`), nunca una imagen ni un script de terceros.
    - Al hover/focus: fondo `verde-700`, borde `dorado-400`, y se despliega hacia la izquierda una etiqueta con fondo `verde-800` y texto dorado "Escríbenos". Transición de 200 ms, respetando `prefers-reduced-motion`.
    - Anillo sutil de pulso dorado (`box-shadow` animado, 2,5 s, `opacity` baja) que se detiene tras 3 ciclos para no saturar.
    - Posición `fixed` bottom-right, `z-index` por debajo del lightbox, con `env(safe-area-inset-bottom)` en iOS. En móvil se reubica arriba de la barra CTA sticky para que no se solapen.
    - `href="https://wa.me/573105145648?text=..."` con mensaje precargado, URL-encoded: `Hola, vi la página de Lotes Campestres Vista Hermosa en Guatapé y quiero más información.` Si el usuario venía de un lote específico, el mensaje incluye el número de lote. `target="_blank" rel="noopener"`, `aria-label="Escribir por WhatsApp a Vista Hermosa Guatapé"`. Dispara `whatsapp_click`.
    - **Barra CTA sticky en móvil**: fondo `verde-900/95` con blur, dos botones — WhatsApp (outline dorado) y "Agendar visita" (sólido dorado, hace scroll al formulario). Aparece tras 25% de scroll y se oculta cuando el formulario está en viewport.

## 5. SEO — es el criterio principal de éxito

Keyword primaria: **lotes en Guatapé**. Secundarias: lotes campestres Guatapé, lotes con vista al embalse Guatapé, terrenos en venta Guatapé Antioquia, lotes cerca a la Piedra del Peñol.

- `<title>`: `Lotes en Guatapé desde $45.000 el m² | Vista Hermosa` (≤ 60 car.)
- `<meta name="description">`: `10 lotes campestres en Guatapé con vista al embalse y a la Piedra del Peñol. Áreas de 3.500 a 10.000 m² desde $45.000/m². Recorrido virtual 360°.` (≤ 155 car.)
- Un solo `<h1>`. Jerarquía `h2`/`h3` correcta y sin saltos.
- `<link rel="canonical">`, `og:*` completos (usa `/img/og-image-lotes-vista-hermosa-guatape.jpg`, 1200×630), `twitter:card=summary_large_image`, `<html lang="es-CO">`, `geo.position` / `ICBM` con las coordenadas.
- **JSON-LD** (tres bloques separados, validados contra schema.org):
  - `RealEstateListing` con `name`, `description`, `image`, `url`, `geo` (GeoCoordinates), `address` (PostalAddress: Guatapé, Antioquia, CO), `numberOfItems: 10` y `offers` como `AggregateOffer` con `priceCurrency: "COP"`, `lowPrice: 45000`, `highPrice: 100000`, `unitText: "m2"` y `offerCount: 10`. **El precio declarado es el del metro cuadrado, no el del lote** — nunca declares un total como precio de oferta.
  - `FAQPage` con las 8 preguntas reales del acordeón.
  - `BreadcrumbList` simple.
- `robots.txt` permitiendo todo + línea `Sitemap:`. Sitemap con `@astrojs/sitemap`.
- Nombres de archivo de imagen ya vienen optimizados para SEO — **no los renombres**.
- Un `<h2>` debe contener literalmente "lotes en Guatapé" y otro "Piedra del Peñol", de forma natural.
- Página `/gracias` con `<meta name="robots" content="noindex">` (destino post-envío, donde se dispara la conversión).

## 6. Analítica

- GA4 y Meta Pixel cargados **de forma diferida** (después de `load` o al primer scroll/interacción), con los IDs desde `.env` (`PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`). Si el ID está vacío, no se inyecta nada.
- Eventos a `dataLayer`: `lead_form_view`, `lead_form_submit`, `whatsapp_click`, `tour_360_abierto`, `galeria_abierta`, `lote_interes_click`, `calculadora_usada` (con `area` y `valor_m2`), `banda_area_click`.
- Captura y persiste en `sessionStorage` los parámetros `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`, y los envía ocultos en el formulario junto con `referrer` y `landing_url`.

## 7. Formulario y envío al CRM (crítico)

**Campos**: nombre completo (req), WhatsApp (req, valida formato colombiano, 10 dígitos, prefijo país opcional), correo (req, valida), área de interés (select: 3.500–5.000 / 5.000–7.500 / 7.500–10.000 m² / Sin definir), lote de interés (oculto, se llena desde el plano), valor por m² e inversión estimada (ocultos, se llenan desde la calculadora), mensaje (opcional, textarea), **checkbox obligatorio de autorización de tratamiento de datos personales (Ley 1581 de 2012)** con enlace a la política.

**Comportamiento**: validación en cliente con estado por campo (island React, sin librerías de formularios), botón deshabilitado durante el envío, mensajes de error accesibles (`aria-describedby`, `role="alert"`), honeypot invisible + campo `timestamp` para descartar bots (rechaza envíos en < 3 segundos). Al éxito: redirige a `/gracias`.

**Backend** — como Hostinger compartido no ejecuta Node, el formulario hace `POST` a `/api/lead.php`, un proxy que reenvía al webhook del CRM:

```php
<?php
// public/api/lead.php — proxy servidor→servidor: la URL del webhook NUNCA viaja al navegador
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit(json_encode(['ok'=>false])); }

$WEBHOOK = getenv('CRM_WEBHOOK_URL') ?: 'PENDIENTE_URL_WEBHOOK_CRM'; // TODO: definir en Hostinger (hPanel → Variables de entorno o .env fuera de public_html)
$SECRET  = getenv('CRM_WEBHOOK_SECRET') ?: '';

$in = json_decode(file_get_contents('php://input'), true) ?: [];
// honeypot + tiempo mínimo
if (!empty($in['website']) || (time() - (int)($in['ts'] ?? 0)) < 3) { echo json_encode(['ok'=>true]); exit; }

// validación y saneamiento server-side (no confiar en el cliente)
// ... nombre, whatsapp, email, consentimiento obligatorio ...

$payload = [ /* campos normalizados + utm + ip + user_agent + fecha ISO + origen: 'landing-vista-hermosa' */ ];

$ch = curl_init($WEBHOOK);
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Signature: '.hash_hmac('sha256', json_encode($payload), $SECRET)],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 8,
]);
$res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);

// si el CRM falla, guardar el lead en un .jsonl fuera de public_html para no perderlo, y responder ok
```

Completa ese archivo entero: validación real, rate limit simple por IP (archivo temporal, máx. 5 envíos/hora), respaldo en `.jsonl` cuando el webhook responda ≠ 2xx, y `.env.example` con `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_SECRET`, `PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_WHATSAPP`.

Payload al CRM en JSON plano y estable:
`{ origen, fecha_iso, nombre, whatsapp, email, area_interes, lote_interes, valor_m2_estimado, inversion_estimada, mensaje, consentimiento, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, referrer, landing_url, ip, user_agent }`

## 8. Assets

La carpeta `public-img/` que acompaña este prompt ya trae **todo convertido a WebP, con nombres SEO y en tres tamaños** (600/1200/1920 px; panorámicas en 2400; logo en 192/512 + versión dorada transparente + favicons + OG image). Cópiala a `public/img/` y **no re-comprimas nada**.

`imagenes.json` trae el `alt` y el `caption` de cada imagen ya redactados en español con keywords. Conviértelo a `src/data/galeria.ts` tipado y usa esos textos literalmente.

Ya incorporado del brochure oficial: `renders/plano-lotes-vista-hermosa-guatape` (plano aéreo del predio con los lotes numerados y los vendidos marcados), en 600/1200/1920 px.

Del brochure **no** se extrajeron las fotos del malecón de Guatapé ni de la Piedra del Peñol: no consta que sean material propio y el riesgo de derechos de autor no compensa. Si el cliente confirma que las tiene licenciadas, se agregan después.

Faltantes conocidos (deja TODOs visibles, no inventes): valor por m² lote por lote, área exacta de cada lote, teléfono fijo y correo, razón social y NIT del vendedor, política de tratamiento de datos, estado de la licencia en Planeación Municipal.

El levantamiento topográfico radicado (Consultoría YJC) existe pero **no se usa como fuente de áreas comerciales**: su numeración es por predio y no coincide con la del brochure. Sirve solo como respaldo técnico y para mencionar que el proyecto está radicado en Planeación.

## 9. Entregables y orden de trabajo

1. Scaffold Astro + Tailwind + config + tokens de color + fuentes + layout base con todo el `<head>` SEO.
2. Data layer (`proyecto.ts`, `lotes.ts`, `galeria.ts`, `faq.ts`) desde `imagenes.json`.
3. Secciones en el orden de la sección 4, cada una como componente independiente.
4. Islands: formulario, lightbox, filtro de galería, menú móvil.
5. `lead.php`, `.env.example`, `robots.txt`, sitemap, `/gracias`, `/404`.
6. `README.md` con: cómo correr en local, cómo buildear, **pasos exactos de despliegue en Hostinger** (subir `dist/` a `public_html`, dónde poner `.env` fuera de `public_html`, cómo apuntar el dominio, cómo forzar HTTPS y activar caché de assets con `.htaccess`), y la lista de TODOs pendientes de confirmar con el cliente.
7. Un `.htaccess` con compresión Brotli/Gzip, `Cache-Control: max-age=31536000, immutable` para `/img` y `/fonts`, y redirección a HTTPS + no-www.

## 10. Repositorio y despliegue automatizado (hazlo tú, no lo dejes al final)

Inicializa Git desde el primer commit y prepara el despliegue continuo a Hostinger. Hostinger compartido **no ejecuta `npm run build`**, así que el build corre en GitHub Actions y solo se sube `dist/`.

- `.gitignore`: `node_modules`, `dist`, `.env`, `.astro`, `.DS_Store`, `*.log`. **Nunca** commitees `.env` ni la URL del webhook.
- `.github/workflows/deploy.yml`: en push a `main` → `actions/checkout` → Node 20 con caché de npm → `npm ci` → `npm run build` → subida por FTP de `./dist/` a `/public_html/` con `SamKirkland/FTP-Deploy-Action@v4.3.5`, usando los secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`. Excluye del sync `**/.git*`, `**/node_modules/**` y `.env`.
- Como `lead.php` vive en `public/api/`, Astro lo copia a `dist/api/lead.php` y viaja en el mismo deploy. El `.htaccess` también va en `public/`.
- El archivo con el webhook y el secret del CRM se sube **una sola vez a mano**, fuera de `public_html` (ej. `/home/uXXXX/config/crm.php`), y `lead.php` lo incluye con `require_once`. Así no está en el repo ni es accesible por HTTP. Deja el `require_once` escrito con un comentario explicando la ruta.
- `README.md` documenta: setup local, los tres secrets de GitHub, dónde se saca cada credencial FTP en hPanel, y cómo hacer un deploy manual de emergencia (build local + subir `dist/` por el Administrador de archivos).

Primer commit con la estructura base y el workflow ya funcionando, aunque el sitio esté a medias: así verificamos el pipeline antes de que haya nada que perder.

---

Trabaja sección por sección y muéstrame el resultado antes de avanzar a la siguiente. No generes texto de relleno: si un dato no está en este documento, déjalo como TODO visible en el código.
