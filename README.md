# Lotes Campestres Vista Hermosa — Guatapé

Landing de una sola ruta para la venta de lotes campestres en el sector Vista Hermosa,
a 15 minutos de Guatapé (Antioquia). Objetivo único: **captar leads calificados por
formulario y WhatsApp**.

- **Stack:** Astro 5 · Tailwind CSS 4 · islas React puntuales
- **Hosting:** Hostinger, build automático en cada `push`. **Salida 100 % estática**
- **Formulario:** entrega por WhatsApp. El endpoint de servidor está aparcado y
  documentado abajo — activarlo tumbó producción una vez, leer antes de intentarlo

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

**Estado actual: el formulario entrega el lead por WhatsApp.** No hay endpoint
de servidor activo, y eso es deliberado.

### Por qué no hay adaptador de Node

Se implementó y se probó un endpoint `/api/lead` con `@astrojs/node`. Al
desplegarlo, **producción devolvió 403 Forbidden en toda la web**.

Causa: al añadir el adaptador, Astro parte la salida en `dist/client/` y
`dist/server/`. El docroot de Hostinger sigue apuntando a `dist/`, que se quedó
sin `index.html` → 403. De regalo, `dist/server/entry.mjs` quedaba descargable
por HTTP. El sondeo lo dejó claro:

```
/                   403   dist/ sin index.html
/client/index.html  200   el sitio se había movido un nivel abajo
/api/lead           404   NO había proceso Node corriendo
/server/entry.mjs   200   bundle de servidor expuesto
```

Nótese que `/api/lead` daba 404: **el proceso Node nunca llegó a arrancar**,
porque el campo `Entry file` del panel estaba vacío. Es decir, el adaptador
tumbó el sitio sin llegar a aportar nada.

### Cómo activar el backend (si se quiere, y en este orden)

El endpoint está **probado y funcionando**, aparcado en
`src/server/lead-endpoint.ts`. Vive fuera de `src/pages/` a propósito: ahí sería
una ruta, y una ruta con `prerender = false` exige adaptador.

1. En hPanel, rellenar **`Entry file` = `dist/server/entry.mjs`** y confirmar
   que el proceso Node arranca y responde. **Verificar esto ANTES de tocar el
   código.**
2. Mover `src/server/lead-endpoint.ts` → `src/pages/api/lead.ts`
3. Añadir `adapter: node({ mode: 'standalone' })` en `astro.config.mjs`
4. Definir `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_SECRET` y `PUBLIC_BACKEND_LEADS=1`
5. **Comprobar que `/` sigue devolviendo 200** antes de dar el cambio por bueno

> Si el docroot no se puede cambiar a `dist/client`, el adaptador volverá a
> romper la web. Mejor dejarlo como está.

### Qué hace hoy el formulario

Valida en cliente y abre WhatsApp con un mensaje que ya lleva **nombre, correo,
celular, área de interés, lote e inversión estimada** — todo lo que el visitante
configuró en el plano y la calculadora. No se pierde ningún lead y no hay
terceros de por medio.

La navegación ocurre dentro del gesto del usuario y sin `await` delante: con una
promesa por medio, el navegador deja de tratarlo como acción del usuario y el
bloqueador de ventanas la corta en silencio. Si aun así se bloqueara la pestaña,
`/gracias` tiene su propio botón de WhatsApp.

Lo que se pierde frente al endpoint: las **UTM no viajan** con el lead (van en
`sessionStorage`, pero no caben en el mensaje sin ensuciarlo) y no hay registro
automático en el CRM. Ambas cosas vuelven al activar el backend.

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
