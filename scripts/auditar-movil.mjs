/**
 * Auditoría de anchos reales de móvil.
 *
 * Mide el DOM renderizado a 360 y 390 px —los anchos de la mayoría de celulares
 * reales— y reporta cualquier elemento que se salga del viewport. Guarda además
 * una captura por sección.
 *
 * Existe porque una auditoría "a ojo" sobre las clases de Tailwind no detecta un
 * desbordamiento: hay que medir el layout. Y porque una captura sin emulación
 * móvil MIENTE (Chrome ignora el meta viewport en modo escritorio y el resultado
 * parece roto cuando no lo está).
 *
 * Uso:
 *   npm run build && npm run preview -- --port 4400
 *   npm run auditar:movil
 *   npm run auditar:movil -- https://lotescampestresguatape.com/
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL_BASE = process.argv[2] || "http://127.0.0.1:4400/";
const SALIDA = process.env.SHOTS || "./capturas-movil";
const ANCHOS = [360, 390];

const SECCIONES = [
  ["hero", null],
  ["datos", "#datos-clave"],
  ["ubicacion", "#ubicacion"],
  ["tour", "#recorrido-360"],
  ["galeria", "#galeria"],
  ["lotes", "#lotes"],
  ["calculadora", "#calculadora"],
  ["contacto", "#contacto"],
  ["faq", "#faq"],
];

mkdirSync(SALIDA, { recursive: true });

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars"],
});

let fallos = 0;

for (const ancho of ANCHOS) {
  const pagina = await navegador.newPage();
  // isMobile + hasTouch son imprescindibles: sin ellos Chrome no aplica el
  // meta viewport y el render no se parece al de un celular.
  await pagina.setViewport({
    width: ancho,
    height: 800,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await pagina.goto(URL_BASE, { waitUntil: "networkidle0" });

  const informe = await pagina.evaluate((ancho) => {
    const culpables = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).position === "fixed") continue;
      if (r.right > ancho + 1) {
        culpables.push({
          etiqueta: el.tagName.toLowerCase(),
          clase: (el.className.baseVal ?? el.className ?? "").toString().slice(0, 70),
          ancho: Math.round(r.width),
          derecha: Math.round(r.right),
          texto: (el.textContent || "").trim().slice(0, 40),
        });
      }
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      culpables: culpables.slice(0, 15),
    };
  }, ancho);

  const desborde = informe.scrollWidth - ancho;
  console.log(`
=== ${ancho}px ===`);
  console.log(`scrollWidth: ${informe.scrollWidth} (desborde: ${desborde}px)`);

  if (desborde > 0 || informe.culpables.length > 0) {
    fallos++;
    for (const c of informe.culpables) {
      console.log(`  <${c.etiqueta}> ancho:${c.ancho} derecha:${c.derecha}  ${c.clase}`);
      if (c.texto) console.log(`      "${c.texto}"`);
    }
  } else {
    console.log("  sin elementos fuera del viewport");
  }

  for (const [nombre, ancla] of SECCIONES) {
    if (ancla) {
      const existe = await pagina.evaluate((a) => {
        const el = document.querySelector(a);
        if (!el) return false;
        el.scrollIntoView({ behavior: "instant", block: "start" });
        return true;
      }, ancla);
      if (!existe) continue;
      await new Promise((r) => setTimeout(r, 400));
    }
    await pagina.screenshot({ path: `${SALIDA}/${ancho}-${nombre}.png` });
  }

  await pagina.close();
}

await navegador.close();
console.log(`
Capturas en ${SALIDA}`);
process.exit(fallos > 0 ? 1 : 0);
