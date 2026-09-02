# Lotes Campestres Vista Hermosa — Guatapé

Landing de una sola ruta para la venta de lotes campestres en el sector Vista Hermosa,
a 15 minutos de Guatapé (Antioquia). Objetivo único: **captar leads calificados por
formulario y WhatsApp**.

- **Stack:** Astro 5 · Tailwind CSS 4 · islas React puntuales
- **Hosting:** Hostinger, aplicación **Node 22**, build automático en cada `push`
- **Backend del formulario:** `/api/lead`, la única ruta que corre en servidor

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

Para probar el formulario de verdad no basta `astro dev`: hay que compilar y arrancar
el servidor. Ver *Backend del formulario → Probarlo en local*.

---

## Estructura

```
public/
  img/          assets ya optimizados (WebP, 3 tamaños, nombres SEO) — NO recomprimir ni renombrar
  fonts/        Cormorant Garamond + Inter, variables, subset latin, self-hosted
  .htaccess     HTTPS, sin www, compresión, caché
  robots.txt
src/
  components/   una sección por componente
  data/         proyecto.ts · lotes.ts · galeria.ts · faq.ts — toda la data de negocio
  layouts/      BaseLayout.astro — head SEO completo y JSON-LD
  lib/lead.ts   validación, rate limit, respaldo y envío al CRM (solo servidor)
  pages/        index.astro · gracias.astro · 404.astro · api/lead.ts
  styles/       global.css — tokens de marca y @font-face

dist/
  client/       lo estático ya compilado
  server/       entry.mjs — el proceso que arranca Hostinger
.data/          respaldo de leads y rate limit (runtime, nunca versionado)
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

Y subir `dist/` completo por el Administrador de archivos de hPanel, **con sus dos
subcarpetas `client/` y `server/`**: sin `server/` no hay proceso Node que arrancar.
El administrador oculta los archivos que empiezan por punto hasta que se activa
*Mostrar archivos ocultos*, así que hay que verificar a mano que `client/.htaccess`
haya subido.

---

## Backend del formulario

El sitio corre en Hostinger como **aplicación Node 22**. Astro usa
`@astrojs/node` en modo `standalone`: con `output: 'static'` + adaptador, **todo
se prerenderiza salvo las rutas marcadas con `export const prerender = false`**.
Hoy esa es una sola: `/api/lead`.

### Configuración obligatoria en hPanel

En *Websites → Node.js app*:

| Campo | Valor |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| **Entry file** | **`dist/server/entry.mjs`** |
| Node.js version | 22 |

> **El campo `Entry file` es el que hace la diferencia.** Si queda vacío,
> Hostinger sirve solo los estáticos, no arranca proceso Node y `/api/lead`
> devuelve 404: el formulario falla en silencio. Es exactamente lo que pasaba
> antes de la Etapa 6.

`package.json` incluye `"start": "node ./dist/server/entry.mjs"` por si el panel
prefiere un comando de arranque en vez de un archivo de entrada.

El servidor standalone lee `PORT` y `HOST` del entorno (por defecto `4321`).
Hostinger normalmente inyecta `PORT`; si el proceso arranca pero no responde,
es lo primero que hay que revisar.

### Variables de entorno (hPanel → Environment variables)

| Variable | Para qué |
|---|---|
| `CRM_WEBHOOK_URL` | Webhook del CRM. **Pegar aquí cuando exista.** |
| `CRM_WEBHOOK_SECRET` | Firma HMAC-SHA256 en la cabecera `X-Signature` |
| `LEADS_DATA_DIR` | Opcional. Por defecto `<raíz>/.data` |

Ninguna lleva prefijo `PUBLIC_`, así que **Astro no las expone al navegador**.
Se leen en cada petición: cambiar el webhook en el panel **no exige recompilar**.

### Qué pasa mientras no exista el webhook

Nada se pierde. El endpoint guarda **siempre** el lead en
`<LEADS_DATA_DIR>/leads.jsonl` antes de responder, anotando el estado del CRM:

| `crm` | Significa |
|---|---|
| `sin-configurar` | Aún no hay `CRM_WEBHOOK_URL`. Es el estado normal hoy. |
| `enviado` | El CRM respondió 2xx |
| `error` / `timeout` | El CRM falló. **El lead está en el archivo.** |

El visitante ve éxito en los cuatro casos. Solo se le pide reintentar si fallan
a la vez el CRM y la escritura en disco, que es el único escenario de pérdida real.

Cuando el CRM exista: pegar la URL en hPanel, reiniciar la app, y reprocesar los
leads acumulados leyendo el `.jsonl` (una línea = un lead, mismo formato que el
payload del webhook).

### Anti-abuso

- **Honeypot** `website`, fuera de pantalla y del recorrido de teclado.
- **Tiempo mínimo** de 3 s entre pintar el formulario y enviarlo.
- **Rate limit** de 5 envíos/hora por IP, con la IP hasheada en disco.

Los bots reciben `200 {ok:true}` sin que se guarde nada: un error les enseñaría
qué cambiar, un éxito falso los deja creyendo que ganaron.

### Probarlo en local

```bash
npm run build
node ./dist/server/entry.mjs        # http://localhost:4321

TS=$(( $(date +%s000) - 5000 ))
curl -X POST http://localhost:4321/api/lead   -H 'Content-Type: application/json'   -d "{\"nombre\":\"Prueba\",\"whatsapp\":\"3105145648\",\"email\":\"a@b.co\",\"consentimiento\":true,\"website\":\"\",\"ts\":$TS}"
```

`ts` debe ser al menos 3 s anterior a ahora, o el envío se descarta como bot.
El lead aparece en `.data/leads.jsonl`.

> `astro dev` **no** sirve `/api/lead` igual que producción en todos los casos:
> para probar el endpoint de verdad, compila y arranca `entry.mjs`.

### Pendiente de verificar tras el primer deploy con Node

El `.htaccess` funcionaba con hosting estático (comprobado: las cabeceras de
seguridad y el caché inmutable de `/img` llegaban al navegador). Con el sitio
servido por un proceso Node, **hay que volver a comprobarlo**: si Hostinger deja
de procesarlo, se pierden la caché inmutable de `/img` y `/fonts` y las
cabeceras de seguridad, lo que afecta directamente al presupuesto de
rendimiento. Comprobar con:

```bash
curl -sI https://lotescampestresguatape.com/img/logo/favicon-32.png | grep -i cache-control
```

Si no aparece `max-age=31536000, immutable`, hay que replicar esas cabeceras en
el servidor Node.

## TODOs pendientes de confirmar con el cliente

Están marcados en el código con `// TODO`. Ninguno se inventó ni se rellenó con datos
plausibles: van visibles a propósito.

| # | Pendiente | Dónde |
|---|---|---|
| 1 | Teléfono fijo y correo de contacto | `src/data/proyecto.ts` |
| 2 | ~~Dominio definitivo~~ — resuelto: `lotescampestresguatape.com` | — |
| 3 | Razón social y NIT del vendedor | footer |
| 4 | URL del webhook del CRM y su secreto, **y decidir el mecanismo de envío** (ver arriba: el hosting es Node, no PHP) | Etapa 6 |
| 5 | **Política de tratamiento de datos personales (Ley 1581 de 2012).** Bloqueante para publicar: el checkbox de consentimiento se muestra sin enlace hasta que exista. Se activa poniendo la URL en `proyecto.politicaDatos` | `src/data/proyecto.ts` |
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
