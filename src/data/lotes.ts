/**
 * LOTES REALES — fuente única de verdad del inventario.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ REGLAS QUE NO SE DEBEN REVERTIR SIN CONFIRMAR CON EL CLIENTE             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * 1. EL PRECIO TOTAL ES LA CIFRA PRINCIPAL EN TODA LA PÁGINA.
 *    El valor por m² real de este inventario va de $10.990 (Vista Hermosa 01,
 *    50.954 m²) a $106.959 (Vista Hermosa 03, 3.880 m²): casi 10× de diferencia.
 *    Una cifra con ese rango no comunica nada por sí sola y, peor, invita a
 *    comparar lotes que no son comparables. Por eso el precio total manda y el
 *    $/m² va siempre como dato SECUNDARIO, dentro de la ficha de cada lote.
 *
 * 2. `precioM2` SE CALCULA, NUNCA SE ESCRIBE A MANO.
 *    Solo hay dos números por lote: `area` y `precio`. Cualquier valor por m²
 *    que aparezca en el sitio sale de `precioM2()`. Si algún día se hardcodea
 *    uno, se desincroniza en cuanto cambie un precio.
 *
 * 3. LAS ÁREAS SON "ÁREA LICENCIA": YA DESCUENTAN LA VÍA.
 *    Son las áreas netas vendibles entregadas por el cliente. No se recalculan
 *    contra el levantamiento topográfico ni contra el render del plano.
 *
 * 4. TODOS LOS LOTES ESTÁN COMO "disponible".
 *    TODO: el cliente aún no ha confirmado cuáles DOS lotes están vendidos. El
 *    plano del brochure muestra dos etiquetas "SOLD" que no se pueden atribuir a
 *    un lote concreto con certeza. Marcar como vendido un lote disponible cuesta
 *    un cliente, así que hasta que lo confirme, los 11 quedan en "disponible".
 *    Al cambiar dos a "vendido": revisar `precioDesdeComercial` y
 *    `precioM2DesdeComercial` en proyecto.ts (ver el TODO de ese archivo).
 */

export type EstadoLote = "disponible" | "vendido";

export type PredioId = "vista-hermosa" | "la-piedrita" | "la-culebra";

export interface Predio {
  id: PredioId;
  /** Como se muestra al usuario */
  nombre: string;
}

/**
 * Los tres predios del proyecto. La numeración de lotes es POR PREDIO: hay un
 * "01" en Vista Hermosa, otro en La Piedrita y otro en La Culebra. NO existe una
 * secuencia 01–11; escribirla rompe la correspondencia con el plano y con la
 * forma en que el cliente y los asesores nombran cada lote.
 */
export const predios: Predio[] = [
  { id: "vista-hermosa", nombre: "Vista Hermosa" },
  { id: "la-piedrita", nombre: "La Piedrita" },
  { id: "la-culebra", nombre: "La Culebra" },
];

export interface Lote {
  /** Identificador estable: "vista-hermosa-01". Es lo que viaja al CRM. */
  id: string;
  predio: PredioId;
  /** Número dentro de SU predio, 1–5 */
  numero: number;
  /** "01", "02"… — como se muestra al usuario */
  etiqueta: string;
  /** m² de área licencia (neta, ya descontada la vía) */
  area: number;
  /** COP, precio total del lote */
  precio: number;
  estado: EstadoLote;
  /**
   * Polígono del hotspot en el sistema de coordenadas de PLANO_VIEWBOX.
   * Formato de `points` de <polygon>: "x1,y1 x2,y2 x3,y3 …"
   *
   * HOY NO SE USAN: `PLANO_INTERACTIVO` está en false, así que estos polígonos
   * no se pintan. Se conservan para no rehacer el trazado cuando se reactive.
   *
   * TODO (ANTES DE PONER `PLANO_INTERACTIVO` EN true): la asignación
   * polígono → lote es PROVISIONAL. Los polígonos se trazaron a ojo sobre el
   * render y se emparejaron con los lotes reales por tamaño relativo (el
   * polígono más grande al lote más grande, y así sucesivamente), que es la
   * única correspondencia defendible sin el plano rotulado. Hay que
   * verificarlos contra el plano rotulado del cliente. Se ajustan aquí, no en
   * el componente.
   */
  hotspot: string;
}

/**
 * Sistema de coordenadas del plano interactivo.
 * El archivo de 1920 px mide 1920×1588; aquí se trabaja en el espacio de 1200 px
 * (1200×993), que es la escala sobre la que se trazaron los polígonos. El <svg>
 * se superpone con este viewBox y escala solo con la imagen.
 */
export const PLANO_VIEWBOX = { ancho: 1200, alto: 993 } as const;

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ PLANO INTERACTIVO — APAGADO A PROPÓSITO                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * En `false`, el plano se publica como IMAGEN DE REFERENCIA: sin hotspots, sin
 * tooltips, sin foco de teclado y sin área ni precio superpuestos. En `true`,
 * vuelve el <svg> de polígonos con su tooltip y su evento `vh:lote-seleccionado`.
 *
 * POR QUÉ ESTÁ APAGADO:
 * No sabemos qué polígono corresponde a qué lote. Los polígonos se trazaron a
 * ojo sobre el render y se emparejaron con los lotes por tamaño relativo, que es
 * una conjetura razonable pero conjetura al fin. Con el tooltip encendido, un
 * emparejamiento equivocado le enseña al visitante un PRECIO EQUIVOCADO SOBRE
 * UNA PARCELA CONCRETA. Eso no es un fallo de maquetación: es una cifra falsa
 * sobre la que alguien puede tomar una decisión de compra.
 *
 * El plano interactivo aportaba exploración; el inventario lote por lote (ver
 * TablaLotes.astro) ya cumple esa función y sus cifras sí son exactas. El riesgo
 * no compensa lo que se gana.
 *
 * Y HAY UN SEGUNDO MOTIVO: el render lleva rotulados "Lote 01"…"Lote 11"
 * IMPRESOS EN LA IMAGEN —la numeración corrida del brochure anterior—, que
 * contradicen la numeración vigente por predio.
 *
 * CÓMO REACTIVARLO, cuando llegue el render rotulado por predio:
 *   1. Confirmar con el cliente qué polígono es qué lote y corregir los
 *      `hotspot` de cada lote contra el plano rotulado.
 *   2. Sustituir la imagen por el render nuevo (mismo `PLANO.base`).
 *   3. Poner esta bandera en `true`. El componente ya tiene todo el código.
 *   4. Volver a revisar el aviso del figcaption: si el render nuevo rotula por
 *      predio, la advertencia de "numeración anterior" sobra.
 */
export const PLANO_INTERACTIVO: boolean = false;

export const PLANO = {
  base: "renders/plano-lotes-vista-hermosa-guatape",
  alt: "Plano aéreo con la distribución de los 11 lotes campestres del proyecto en Guatapé, repartidos entre los predios Vista Hermosa, La Piedrita y La Culebra",
  caption: "Distribución de los lotes en los tres predios",
  ancho: 1200,
  alto: 993,
} as const;

/**
 * INVENTARIO REAL. Orden de lectura: por predio y número, que es como lo nombra
 * el cliente. Las vistas ordenadas por precio se derivan más abajo.
 */
export const lotes: Lote[] = [
  // ── Vista Hermosa ─────────────────────────────────────────────────────────
  {
    id: "vista-hermosa-01",
    predio: "vista-hermosa",
    numero: 1,
    etiqueta: "01",
    area: 50954,
    precio: 560_000_000,
    estado: "disponible",
    hotspot: "40,360 210,300 300,420 540,520 545,640 300,700 90,690 30,540",
  },
  {
    id: "vista-hermosa-02",
    predio: "vista-hermosa",
    numero: 2,
    etiqueta: "02",
    area: 7000,
    precio: 490_000_000,
    estado: "disponible",
    hotspot: "620,186 760,170 782,262 700,300 616,270",
  },
  {
    id: "vista-hermosa-03",
    predio: "vista-hermosa",
    numero: 3,
    etiqueta: "03",
    area: 3880,
    precio: 415_000_000,
    estado: "disponible",
    hotspot: "1070,554 1180,550 1190,616 1112,634 1066,604",
  },
  {
    id: "vista-hermosa-04",
    predio: "vista-hermosa",
    numero: 4,
    etiqueta: "04",
    area: 5552,
    precio: 470_000_000,
    estado: "disponible",
    hotspot: "692,300 830,292 848,382 760,404 686,372",
  },
  {
    id: "vista-hermosa-05",
    predio: "vista-hermosa",
    numero: 5,
    etiqueta: "05",
    area: 3350,
    precio: 335_000_000,
    estado: "disponible",
    hotspot: "1020,528 1120,524 1132,592 1058,610 1016,580",
  },

  // ── La Piedrita ───────────────────────────────────────────────────────────
  {
    id: "la-piedrita-01",
    predio: "la-piedrita",
    numero: 1,
    etiqueta: "01",
    area: 10000,
    precio: 540_000_000,
    estado: "disponible",
    hotspot: "640,392 780,372 800,470 730,560 640,545",
  },
  {
    id: "la-piedrita-02",
    predio: "la-piedrita",
    numero: 2,
    etiqueta: "02",
    area: 6700,
    precio: 410_000_000,
    estado: "disponible",
    hotspot: "420,258 600,248 614,300 560,344 432,346",
  },
  {
    id: "la-piedrita-03",
    predio: "la-piedrita",
    numero: 3,
    etiqueta: "03",
    area: 3822,
    precio: 340_000_000,
    estado: "disponible",
    hotspot: "962,500 1060,496 1072,566 996,584 956,552",
  },
  {
    id: "la-piedrita-04",
    predio: "la-piedrita",
    numero: 4,
    etiqueta: "04",
    area: 4400,
    precio: 345_000_000,
    estado: "disponible",
    hotspot: "760,372 900,366 918,448 830,466 754,432",
  },
  {
    id: "la-piedrita-05",
    predio: "la-piedrita",
    numero: 5,
    etiqueta: "05",
    area: 4400,
    precio: 345_000_000,
    estado: "disponible",
    hotspot: "862,428 990,424 1004,494 920,512 856,486",
  },

  // ── La Culebra ────────────────────────────────────────────────────────────
  {
    id: "la-culebra-01",
    predio: "la-culebra",
    numero: 1,
    etiqueta: "01",
    area: 12796,
    precio: 250_000_000,
    estado: "disponible",
    hotspot: "128,232 352,222 392,286 370,330 170,345 122,300",
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Derivados. Nada de esto se escribe a mano.
// ───────────────────────────────────────────────────────────────────────────

/** Valor por m² del lote. SIEMPRE calculado — ver la regla 2 de arriba. */
export function precioM2(lote: Lote): number {
  return lote.precio / lote.area;
}

export function nombrePredio(id: PredioId): string {
  return predios.find((p) => p.id === id)?.nombre ?? id;
}

/** "Vista Hermosa 01" — la forma en que se nombra un lote en todo el sitio. */
export function nombreLote(lote: Lote): string {
  return `${nombrePredio(lote.predio)} ${lote.etiqueta}`;
}

export function loteDeId(id: string): Lote | undefined {
  return lotes.find((l) => l.id === id);
}

export function esInteractivo(lote: Lote): boolean {
  return lote.estado === "disponible";
}

export const lotesDisponibles: Lote[] = lotes.filter((l) => l.estado === "disponible");

/** Todos los lotes de menor a mayor precio total. */
export const lotesPorPrecio: Lote[] = [...lotes].sort((a, b) => a.precio - b.precio);

/**
 * Lotes agrupados por predio para la sección comercial: los predios se ordenan
 * por su lote más barato y, dentro de cada uno, los lotes de menor a mayor
 * precio. Así la primera cifra que ve el visitante es siempre la más baja.
 */
export interface GrupoPredio {
  predio: Predio;
  lotes: Lote[];
  /** Precio del lote más barato del predio. Ordena los grupos. */
  precioDesde: number;
}

export const lotesAgrupadosPorPredio: GrupoPredio[] = predios
  .map((predio) => {
    const suyos = lotesPorPrecio.filter((l) => l.predio === predio.id);
    return {
      predio,
      lotes: suyos,
      precioDesde: suyos.length > 0 ? suyos[0]!.precio : Infinity,
    };
  })
  .filter((g) => g.lotes.length > 0)
  .sort((a, b) => a.precioDesde - b.precioDesde);

/** Extremos reales del inventario disponible. Alimentan copy, SEO y JSON-LD. */
function extremos(valores: number[]): { min: number; max: number } {
  return { min: Math.min(...valores), max: Math.max(...valores) };
}

// Si algún día se venden todos, el sitio sigue mostrando el rango del proyecto
// en vez de -Infinity: los extremos caen al inventario completo.
const baseDeCalculo = lotesDisponibles.length > 0 ? lotesDisponibles : lotes;

export const AREAS = extremos(baseDeCalculo.map((l) => l.area));
export const PRECIOS = extremos(baseDeCalculo.map((l) => l.precio));
export const PRECIOS_M2 = extremos(baseDeCalculo.map(precioM2));

// ───────────────────────────────────────────────────────────────────────────
// Calculadora — simulador de cuota inicial
// ───────────────────────────────────────────────────────────────────────────

/**
 * Porcentajes de cuota inicial que ofrece el simulador.
 *
 * TODO: son los tramos habituales del sector, NO un plan de pago confirmado por
 * el cliente. La nota de abajo lo dice explícitamente para no prometer una
 * financiación que quizá no exista. Confirmar las condiciones reales con
 * R&U Ingenieros y, si difieren, cambiarlas aquí.
 */
export const PORCENTAJES_CUOTA_INICIAL = [10, 20, 30] as const;

export const CUOTA_INICIAL_POR_DEFECTO = 20;

export const CALCULADORA = {
  /** Va bajo el resultado. Es la advertencia que sostiene la cifra. */
  nota:
    "Simulación informativa. El porcentaje de cuota inicial y las condiciones de pago se acuerdan directamente con la firma que desarrolla el proyecto.",
} as const;

/** Cuota inicial y saldo de un lote a un porcentaje dado. */
export function simularPago(
  lote: Lote,
  porcentaje: number,
): { cuotaInicial: number; saldo: number } {
  const cuotaInicial = Math.round((lote.precio * porcentaje) / 100);
  return { cuotaInicial, saldo: lote.precio - cuotaInicial };
}
