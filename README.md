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

Hostinger compartido no ejecuta `npm run build`. El build corre en GitHub Actions y por
FTP solo viaja el contenido ya compilado de `dist/`.

### 1. Crear el repositorio y conectarlo

El repo está inicializado en local, sin remote. Cuando lo crees en GitHub:

```bash
git remote add origin git@github.com:USUARIO/REPO.git
git push -u origin main
```

### 2. Cargar los tres secrets

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | De dónde sale en hPanel |
|---|---|
| `FTP_SERVER` | *Archivos → Cuentas FTP* → campo **Host / Dirección del servidor FTP** |
| `FTP_USERNAME` | *Archivos → Cuentas FTP* → **Nombre de usuario FTP** |
| `FTP_PASSWORD` | *Archivos → Cuentas FTP* → **Cambiar contraseña de la cuenta FTP** (hPanel no muestra la actual: hay que fijar una nueva) |

Opcionalmente, como **variables** (no secrets, en la pestaña *Variables*):
`PUBLIC_SITE_URL`, `PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`.

Con eso, cada `push` a `main` compila y sincroniza `dist/` con `/public_html/`.
También se puede lanzar a mano desde la pestaña **Actions → Run workflow**.

### 3. Las credenciales del CRM van fuera de public_html

La URL del webhook y el secreto **no están en el repositorio ni son accesibles por HTTP**.
Se suben **una sola vez a mano** con el Administrador de archivos de hPanel, a un archivo
PHP fuera de `public_html`:

```
/home/uXXXXXXXX/config/crm.php
```

```php
<?php
// NO va en el repositorio. Fuera de public_html: no es accesible por HTTP.
return [
  'webhook_url' => 'https://…',
  'webhook_secret' => '…',
];
```

`lead.php` lo carga con `require_once` y cae a un respaldo `.jsonl` si el CRM falla, para
no perder ningún lead.

### 4. Dominio y HTTPS

1. hPanel → *Dominios* → apuntar el dominio al hosting (o cambiar los nameservers a los
   de Hostinger si el dominio está en otro registrador).
2. hPanel → *Seguridad → SSL* → instalar el certificado gratuito y esperar a que quede
   **Activo**.
3. La redirección a HTTPS y el `sin www` los fuerza el `.htaccess` que viaja en `dist/`;
   no hace falta activarlos también en hPanel (duplicarlos puede provocar bucles).
4. Actualizar `PUBLIC_SITE_URL` y la línea `Sitemap:` de `public/robots.txt` con el
   dominio real, y volver a desplegar.

### Deploy manual de emergencia

Si Actions falla y hay que publicar ya:

```bash
npm ci
npm run build
```

hPanel → *Archivos → Administrador de archivos* → entrar a `public_html` → subir **el
contenido** de `dist/` (no la carpeta). Verificar que `.htaccess` y `api/lead.php`
quedaron arriba: el administrador de archivos oculta los archivos que empiezan por punto
hasta que se activa *Mostrar archivos ocultos*.

### Probar el formulario

`lead.php` solo se puede validar de verdad en un servidor con PHP. Tras el primer deploy:

1. Enviar el formulario desde el sitio publicado.
2. Confirmar que el lead llegó al CRM.
3. Forzar un fallo (webhook mal apuntado) y confirmar que el lead quedó en el `.jsonl`
   de respaldo fuera de `public_html`.

---

## TODOs pendientes de confirmar con el cliente

Están marcados en el código con `// TODO`. Ninguno se inventó ni se rellenó con datos
plausibles: van visibles a propósito.

| # | Pendiente | Dónde |
|---|---|---|
| 1 | Teléfono fijo y correo de contacto | `src/data/proyecto.ts` |
| 2 | Dominio definitivo | `astro.config.mjs`, `public/robots.txt`, `.env` |
| 3 | Razón social y NIT del vendedor | footer |
| 4 | URL del webhook del CRM y su secreto | `public/api/lead.php`, config fuera de `public_html` |
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
