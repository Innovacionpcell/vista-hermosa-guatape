/**
 * Lotes y bandas de área — sección 7 de la landing.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ DOS DECISIONES EXPLÍCITAS QUE NO SE DEBEN REVERTIR SIN CONFIRMAR         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * 1. NINGÚN LOTE SE MARCA COMO VENDIDO.
 *    El plano del brochure rotula 11 lotes y muestra dos etiquetas "SOLD", pero
 *    las líneas guía no permiten atribuir esos dos SOLD a un número concreto con
 *    certeza. Marcar como vendido un lote que sí está disponible cuesta un
 *    cliente, así que todos los hotspots quedan ACTIVOS y el tooltip no afirma
 *    disponibilidad ninguna: solo identifica el lote e invita a consultar.
 *    TODO: pedir al cliente qué dos lotes están vendidos y pasarlos a "vendido".
 *
 * 2. 11 LOTES EN EL PLANO vs. 10 DISPONIBLES EN LOS DATOS OFICIALES.
 *    proyecto.lotesDisponibles = 10 es la cifra del cliente y manda en todo el
 *    copy y en el JSON-LD. El plano dibuja 11 porcelas porque incluye las
 *    vendidas. Los dos números conviven sin contradecirse mientras el plano no
 *    anuncie un total.
 *    TODO: confirmar con el cliente que 11 totales − 2 vendidos se comunica
 *    como "10 disponibles", o corregir la cifra.
 *
 * 3. NO SE PUBLICA ÁREA NI PRECIO POR LOTE.
 *    Ese desglose no está confirmado. El tooltip del plano muestra únicamente el
 *    número de lote. El precio se comunica siempre como valor por m².
 */

export type EstadoLote = "disponible" | "vendido" | "por-confirmar";

export interface Lote {
  /** Número tal como aparece rotulado en el plano del brochure */
  numero: number;
  /** "01", "02"… — como se muestra al usuario */
  etiqueta: string;
  estado: EstadoLote;
  /**
   * Polígono del hotspot, en el sistema de coordenadas de PLANO_VIEWBOX.
   * Formato de `points` de <polygon>: "x1,y1 x2,y2 x3,y3 …"
   *
   * TODO: estos polígonos son una PRIMERA APROXIMACIÓN trazada a ojo sobre el
   * render. Sirven para que la interacción funcione, pero hay que ajustarlos
   * visualmente contra el plano antes de publicar. Se ajustan aquí, no en el
   * componente.
   */
  hotspot: string;
}

/**
 * Sistema de coordenadas del plano interactivo.
 * El archivo de 1920 px mide 1920×1588; aquí se trabaja en el espacio de 1200 px
 * (1200×993), que es la escala sobre la que se trazaron los polígonos. El <svg>
 * se superpone con este viewBox y escala solo con la imagen, sea cual sea el
 * tamaño servido.
 */
export const PLANO_VIEWBOX = { ancho: 1200, alto: 993 } as const;

export const PLANO = {
  base: "renders/plano-lotes-vista-hermosa-guatape",
  alt: "Plano aéreo con la distribución de los 11 lotes campestres del proyecto Vista Hermosa en Guatapé",
  /**
   * Caption sin número, por decisión explícita: "11 lotes — 2 vendidos" en la
   * misma pantalla que "10 lotes disponibles" se lee como una contradicción.
   */
  caption: "Distribución de los lotes del proyecto",
  ancho: 1200,
  alto: 993,
} as const;

export const lotes: Lote[] = [
  {
    numero: 1,
    etiqueta: "01",
    estado: "por-confirmar",
    hotspot: "128,232 352,222 392,286 370,330 170,345 122,300",
  },
  {
    numero: 2,
    etiqueta: "02",
    estado: "por-confirmar",
    hotspot: "420,258 600,248 614,300 560,344 432,346",
  },
  {
    numero: 3,
    etiqueta: "03",
    estado: "por-confirmar",
    hotspot: "40,360 210,300 300,420 540,520 545,640 300,700 90,690 30,540",
  },
  {
    numero: 4,
    etiqueta: "04",
    estado: "por-confirmar",
    hotspot: "640,392 780,372 800,470 730,560 640,545",
  },
  {
    numero: 5,
    etiqueta: "05",
    estado: "por-confirmar",
    hotspot: "620,186 760,170 782,262 700,300 616,270",
  },
  {
    numero: 6,
    etiqueta: "06",
    estado: "por-confirmar",
    hotspot: "692,300 830,292 848,382 760,404 686,372",
  },
  {
    numero: 7,
    etiqueta: "07",
    estado: "por-confirmar",
    hotspot: "760,372 900,366 918,448 830,466 754,432",
  },
  {
    numero: 8,
    etiqueta: "08",
    estado: "por-confirmar",
    hotspot: "862,428 990,424 1004,494 920,512 856,486",
  },
  {
    numero: 9,
    etiqueta: "09",
    estado: "por-confirmar",
    hotspot: "962,500 1060,496 1072,566 996,584 956,552",
  },
  {
    numero: 10,
    etiqueta: "10",
    estado: "por-confirmar",
    hotspot: "1020,528 1120,524 1132,592 1058,610 1016,580",
  },
  {
    numero: 11,
    etiqueta: "11",
    estado: "por-confirmar",
    hotspot: "1070,554 1180,550 1190,616 1112,634 1066,604",
  },
];

/** ¿El hotspot es interactivo? Hoy todos lo son, por la decisión 1 de arriba. */
export function esInteractivo(lote: Lote): boolean {
  return lote.estado !== "vendido";
}

/**
 * Texto del tooltip. Deliberadamente NO afirma disponibilidad ni muestra área o
 * precio: ninguno de los tres datos está confirmado lote por lote.
 */
export function tooltipLote(lote: Lote): string {
  return lote.estado === "vendido" ? `Lote ${lote.etiqueta} · Vendido` : `Lote ${lote.etiqueta}`;
}

// ───────────────────────────────────────────────────────────────────────────
// 7b. Bandas de área
// ───────────────────────────────────────────────────────────────────────────

export interface BandaArea {
  id: string;
  min: number;
  max: number;
  /** "3.500 – 5.000 m²" */
  etiqueta: string;
  /** Frase de uso. Habla del lote y del entorno, nunca de rentabilidad. */
  uso: string;
  /** Área con la que se precarga la calculadora al pulsar la card */
  areaSugerida: number;
}

export const bandasArea: BandaArea[] = [
  {
    id: "3500-5000",
    min: 3500,
    max: 5000,
    etiqueta: "3.500 – 5.000 m²",
    uso: "Ideal para casa campestre",
    areaSugerida: 4000,
  },
  {
    id: "5000-7500",
    min: 5000,
    max: 7500,
    etiqueta: "5.000 – 7.500 m²",
    uso: "Para casa y huerta",
    areaSugerida: 6000,
  },
  {
    id: "7500-10000",
    min: 7500,
    max: 10000,
    etiqueta: "7.500 – 10.000 m²",
    uso: "Para finca de recreo con amplio retiro",
    areaSugerida: 8500,
  },
];

/** Opciones del <select> "área de interés" del formulario. */
export const opcionesAreaInteres: { valor: string; etiqueta: string }[] = [
  ...bandasArea.map((b) => ({ valor: b.id, etiqueta: b.etiqueta })),
  { valor: "sin-definir", etiqueta: "Sin definir" },
];

// ───────────────────────────────────────────────────────────────────────────
// 7c. Calculadora
// ───────────────────────────────────────────────────────────────────────────

/** Opciones del selector de valor por m². El promedio va preseleccionado. */
export interface OpcionValorM2 {
  valor: number;
  etiqueta: string;
  porDefecto: boolean;
}

export const opcionesValorM2: OpcionValorM2[] = [
  { valor: 45000, etiqueta: "$45.000 (desde)", porDefecto: false },
  { valor: 80000, etiqueta: "$80.000 (promedio)", porDefecto: true },
  { valor: 100000, etiqueta: "$100.000 (máximo)", porDefecto: false },
];

export const CALCULADORA = {
  areaMin: 3500,
  areaMax: 10000,
  areaPaso: 100,
  areaPorDefecto: 5000,
  /** El valor propio que escriba el usuario se acota a este rango. */
  valorM2Min: 45000,
  valorM2Max: 100000,
  /** Va bajo el resultado. Es la advertencia que sostiene la cifra. */
  nota:
    "Valor estimado. El valor por m² varía según el lote y su ubicación dentro del proyecto.",
} as const;
