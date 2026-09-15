# Lotes Campestres Vista Hermosa — Guatapé

Landing de una sola ruta para la venta de lotes campestres en el sector Vista Hermosa,
a 15 minutos de Guatapé (Antioquia). Objetivo único: **captar leads calificados por
formulario y WhatsApp**.

- **Stack:** Astro 5 · Tailwind CSS 4 · islas React puntuales
- **Hosting:** Hostinger, build automático en cada `push`. **Salida 100 % estática**
- **Formulario:** POST desde el navegador a un webhook de n8n, que reenvía al CRM.
  Con fallback a WhatsApp si el webhook no está configurado o falla — ver *Entrega de leads*

> **La unidad comercial es el LOTE, no el metro cuadrado.** El precio total es siempre la
> cifra principal; el valor por m² va como dato secundario dentro de la ficha de cada lote.
> Motivo: el $/m² real del inventario va de $10.990 a $106.959 —casi 10× entre el lote más
> grande y el más pequeño—, así que como cifra suelta no comunica nada e invita a comparar
> lotes que no son comparables. Cualquier cambio debe respetar esa regla.

> **Dos fuentes de cifras, y no se mezclan.** El inventario (11 lotes, áreas, precios,
> $/m²) se **deriva** de `src/data/lotes.ts` y no se escribe a mano en ningún sitio. Las
> cifras de campaña del hero, el `<title>` y la barra de datos —«desde $280.000.000» y
> «desde $45.000/m²»— las **fijó el cliente** y viven en `proyecto.precioDesdeComercial` y
> `proyecto.precioM2DesdeComercial`. No son el mínimo calculado y no se «corrigen» para
> que cuadren con él.

---

## Desarrollo local

```bash
npm install     # requiere Node 20 o superior
npm run dev     # http://localhost:4321
npm run build   # genera dist/
npm run preview # sirve dist/ para revisarlo antes de desplegar
```

Copia `.env.example` a `.env` y rellena lo que necesites. `.env` **nunca** se commitea.

El formulario funciona en `astro dev` sin más: si `PUBLIC_N8N_WEBHOOK_URL` está vacía,
entrega por WhatsApp. Para probar el webhook de verdad, define esa variable en `.env`.

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
  data/         lotes.ts (inventario real) · proyecto.ts · galeria.ts · faq.ts
  layouts/      BaseLayout.astro — head SEO completo y JSON-LD
  pages/        index.astro · gracias.astro · 404.astro
  styles/       global.css — tokens de marca y @font-face

dist/           salida estática, con index.html en la raíz (docroot de Hostinger)
```

`src/data/lotes.ts` es la **fuente única del inventario**: predio, número, área licencia,
precio total y estado. El `$/m²` NO está en los datos — se calcula con `precioM2()`. Los
rangos que alimentan copy, SEO y JSON-LD se derivan en `proyecto.inventario`.

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

## Auditoría de móvil

**El tráfico de esta landing es mayoritariamente móvil.** Los breakpoints de
Tailwind no bastan: hay que medir a los anchos reales de los celulares.

```bash
npm run build
npm run preview -- --port 4400     # en otra terminal
npm run auditar:movil              # mide 360 y 390 px, guarda capturas
```

Reporta cualquier elemento que se salga del viewport y deja una captura por
sección en `capturas-movil/`. Sale con código 1 si detecta desbordamiento, así
que sirve en un hook o en CI.

Dos cosas que este script existe para evitar, ambas ya sufridas:

1. **Auditar "a ojo" las clases de Tailwind no detecta un desbordamiento.** Hay
   que medir el layout renderizado.
2. **Una captura sin emulación móvil miente.** Chrome ignora el `meta viewport`
   en modo escritorio: la página parece rota cuando no lo está. El script activa
   `isMobile` y `hasTouch`, sin los cuales el render no se parece a un celular.

Si Chrome no está en la ruta por defecto, se indica con `CHROME_PATH`.

---

## Entrega de leads

**El formulario hace POST desde el navegador a un webhook de n8n**, y n8n reenvía al CRM.
El sitio sigue siendo 100 % estático: no hay endpoint propio y no debe volver a haberlo.

### Por qué no hay adaptador de Node

Se implementó y se probó un endpoint `/api/lead` con `@astrojs/node`. Al desplegarlo,
**producción devolvió 403 Forbidden en toda la web**.

Causa: al añadir el adaptador, Astro parte la salida en `dist/client/` y `dist/server/`.
El docroot de Hostinger sigue apuntando a `dist/`, que se quedó sin `index.html` → 403. De
regalo, `dist/server/entry.mjs` quedaba descargable por HTTP. El sondeo lo dejó claro:

```
/                   403   dist/ sin index.html
/client/index.html  200   el sitio se había movido un nivel abajo
/api/lead           404   NO había proceso Node corriendo
/server/entry.mjs   200   bundle de servidor expuesto
```

Nótese que `/api/lead` daba 404: **el proceso Node nunca llegó a arrancar**, porque el
campo `Entry file` del panel estaba vacío. El adaptador tumbó el sitio sin llegar a
aportar nada.

Con n8n de por medio eso ya no hace falta: el webhook es el backend, y quien guarda las
credenciales del CRM es n8n, no este repositorio.

### Configurarlo

Definir `PUBLIC_N8N_WEBHOOK_URL` en hPanel (o en `.env` para local). Dos comprobaciones al
hacerlo:

1. Que n8n **acepta el origen** `https://lotescampestresguatape.com` (Settings → CORS /
   `allowedOrigins`). Sin eso el navegador corta el POST y **todos los leads se van por el
   fallback de WhatsApp sin que nadie lo note**.
2. Que el flujo responde 2xx y rápido: el POST aborta a los 8 s.

La URL es **pública por diseño** — lleva prefijo `PUBLIC_` y viaja en el bundle. Es un
buzón de leads, no una API con datos. Nunca se pone aquí un secreto ni una API key del
CRM: lo peor que consigue un tercero es meter basura, y para eso están el honeypot, el
tiempo mínimo de 3 s y el filtrado en n8n.

### Payload

Contrato con el flujo de n8n. Cambiar un nombre aquí obliga a cambiarlo allí.

| Campo | Valor |
|---|---|
| `origen` | siempre `landing-vista-hermosa` |
| `fecha_iso` | ISO 8601 |
| `nombre`, `whatsapp`, `email` | el `whatsapp` va normalizado a `57XXXXXXXXXX` |
| `predio` | `Vista Hermosa` · `La Piedrita` · `La Culebra` |
| `lote` | `01`…`05` — **siempre junto a `predio`**: hay un `01` en cada predio |
| `lote_id` | `vista-hermosa-01` — identificador estable para el CRM |
| `precio_lote`, `area` | números, del lote elegido |
| `cuota_inicial_simulada` | lo que simuló en la calculadora, o `null` |
| `mensaje`, `consentimiento` | |
| `utm_*`, `gclid`, `fbclid`, `referrer`, `landing_url` | atribución, capturada en el `<head>` |

### Nunca perder un lead

Si el webhook está sin configurar, falla, tarda de más o CORS lo corta, el formulario **no
muestra un error**: abre WhatsApp con nombre, correo, celular, lote, área, precio y cuota
inicial ya escritos en el mensaje. El visitante llega igual, por otro canal.

Si el navegador bloquea la pestaña nueva, `/gracias` tiene su propio botón de WhatsApp, así
que nunca se queda sin salida.

## El plano interactivo está apagado

`PLANO_INTERACTIVO = false` en `src/data/lotes.ts`. El render se publica como
**imagen de referencia**: sin hotspots, sin tooltips, sin foco de teclado y sin área
ni precio superpuestos. El `<svg>` de polígonos, el tooltip y su script siguen en
`PlanoLotes.astro`, intactos, detrás de la bandera.

**Por qué.** No sabemos qué polígono corresponde a qué lote. Los polígonos se trazaron
a ojo sobre el render y se emparejaron con los lotes por tamaño relativo —el más grande
al lote más grande—, que es una conjetura razonable pero conjetura. Con el tooltip
encendido, un emparejamiento equivocado le enseña al visitante un **precio equivocado
sobre una parcela concreta**: no es un fallo de maquetación, es una cifra falsa sobre la
que alguien puede decidir una compra. El plano aportaba exploración, y de eso ya se
encarga el inventario lote por lote, cuyas cifras sí son exactas. El riesgo no compensa.

Hay un segundo motivo: el render lleva rotulados `Lote 01`…`Lote 11` **impresos en la
imagen** —la numeración corrida del brochure anterior—, que contradicen la numeración
vigente por predio. De ahí el aviso que acompaña al plano.

**Cómo reactivarlo**, cuando llegue el render rotulado por predio:

1. Confirmar con el cliente qué polígono es qué lote y corregir los `hotspot`.
2. Sustituir la imagen por el render nuevo (mismo `PLANO.base`).
3. Poner `PLANO_INTERACTIVO = true`. El componente ya tiene todo el código.
4. Revisar el aviso del `figcaption`: si el render nuevo rotula por predio, sobra.

## Política de tratamiento de datos

Está escrita y vive en `/politica-de-tratamiento-de-datos/`, pero **todavía no está
publicada**. Sigue la estructura que exigen la Ley 1581 de 2012 y el Decreto 1074 de
2015, y describe el tratamiento real de esta landing: los campos que recoge el
formulario, por dónde viajan y con qué finalidad. No es un texto genérico.

**Faltan dos cosas para publicarla:**

1. **Cinco datos del responsable** que solo puede dar el cliente: `razonSocial`, `nit`,
   `direccionNotificaciones`, `email` y `telefono`, en `src/data/proyecto.ts`. No se
   inventan: identificar mal a quien responde legalmente por los datos de los visitantes
   es peor que dejar el hueco a la vista.
2. **Revisión de un abogado.** La estructura y los plazos corresponden a la norma y el
   flujo de datos que describe es el que implementa este repositorio; nadie ha
   verificado que cubra las obligaciones concretas de esta empresa.

**Mientras falte cualquiera de los cinco campos** (`datosLegalesCompletos === false`):

- la página se sirve con `noindex`;
- muestra un aviso de borrador en rojo y marca cada hueco con el nombre del campo, para
  que sea imposible leerlo como texto definitivo;
- **no se enlaza** desde el footer ni desde el consentimiento del formulario. Un checkbox
  que enlaza a un documento con huecos es peor que uno sin enlace: aparenta que hay
  política y no la hay.

Al rellenar los cinco campos, el `noindex`, el aviso y los dos enlaces se resuelven solos.
No hay nada más que tocar. La página queda fuera del `sitemap.xml` en cualquier caso: es
un documento legal, no contenido que deba competir en búsquedas.

## TODOs pendientes de confirmar con el cliente

Están marcados en el código con `// TODO`. Ninguno se inventó ni se rellenó con datos
plausibles: van visibles a propósito.

| # | Pendiente | Dónde |
|---|---|---|
| 1 | Teléfono fijo y correo de contacto | `src/data/proyecto.ts` |
| 2 | ~~Dominio definitivo~~ — resuelto: `lotescampestresguatape.com` | — |
| 3 | **Razón social, NIT y dirección de notificaciones del responsable**, más teléfono y correo. Son los cinco campos que destraban la política de datos | `src/data/proyecto.ts` |
| 4 | **URL del webhook de n8n** (`PUBLIC_N8N_WEBHOOK_URL`). Mientras esté vacía, el formulario entrega por WhatsApp y no se pierde ningún lead | `.env` / hPanel |
| 5 | **Política de tratamiento de datos (Ley 1581 de 2012): redactada, pendiente de datos y de revisión legal.** Vive en `/politica-de-tratamiento-de-datos/`. Se publica sola al rellenar los cinco campos del punto 3. Ver abajo | `src/pages/politica-de-tratamiento-de-datos.astro` |
| 6 | **Cuáles dos lotes están vendidos.** El plano rotula dos parcelas como "SOLD" pero no se pueden atribuir a un lote concreto con certeza. Por decisión explícita, **los 11 quedan en `disponible`**: marcar mal un lote disponible cuesta un cliente | `src/data/lotes.ts` |
| 7 | **Revisar las cifras de campaña al marcar un lote como vendido.** «Desde $280.000.000» y «desde $45.000/m²» dejan de ser válidas si se venden La Culebra 01 o Vista Hermosa 01, que son los lotes que sostienen el extremo bajo | `src/data/proyecto.ts` |
| 8 | **Qué polígono del plano corresponde a qué lote, y un render rotulado por predio.** Por eso el **plano interactivo está apagado** (`PLANO_INTERACTIVO = false`): se publica como imagen de referencia, sin hotspots ni tooltips. Ver abajo | `src/data/lotes.ts` |
| 8b | Confirmar los porcentajes reales de cuota inicial (hoy 10/20/30 % son tramos habituales del sector, no un plan de pago confirmado) | `src/data/lotes.ts` |
| 9 | Estado de la licencia en Planeación Municipal de Guatapé | sección Especificaciones |
| 10 | Confirmar los ítems de especificaciones no verificados (energía, agua, escrituración) | `src/data/` |
| 11 | Distancias a Medellín, al Aeropuerto JMC y a la Piedra del Peñol (estimadas, no confirmadas) | `src/data/proyecto.ts` |
| 12 | Ajustar visualmente los polígonos de los hotspots del plano (van trazados a ojo) — solo relevante al reactivar el plano interactivo | `src/data/lotes.ts` |

**Fotos del malecón de Guatapé y de la Piedra del Peñol:** no se incluyen. No consta que
sean material propio del cliente y el riesgo de derechos de autor no compensa. Si el
cliente confirma que las tiene licenciadas, se agregan después.

**Levantamiento topográfico (Consultoría YJC):** existe y sirve como respaldo técnico y
para mencionar que el proyecto está radicado en Planeación, pero **no se usa como fuente
de áreas comerciales**. Las áreas publicadas son las «área licencia» que entregó el
cliente: ya descuentan la vía, y son las que se escrituran.

---

Sitio web por **[Growth Digital](https://growthdigital.marketing/)**. Proyecto construido por **[R&U Ingenieros](https://ryuingenieros.com/)**.
