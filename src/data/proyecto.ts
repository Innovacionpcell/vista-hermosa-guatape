/**
 * Datos oficiales del proyecto.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║ DOS FUENTES DISTINTAS, Y NO SE MEZCLAN                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * A) EL INVENTARIO (`inventario`, abajo) se DERIVA de src/data/lotes.ts: número
 *    de lotes, rango de áreas, rango de precios y rango de $/m². Ninguna de esas
 *    cifras se escribe a mano aquí. Cambiar un precio en lotes.ts actualiza el
 *    copy, el JSON-LD y el SEO sin tocar nada más.
 *
 * B) LAS CIFRAS DE CAMPAÑA (`precioDesdeComercial`, `precioM2DesdeComercial`)
 *    las FIJÓ EL CLIENTE y NO se derivan del inventario. Ver el bloque de abajo.
 *
 * LA UNIDAD COMERCIAL ES EL LOTE, NO EL METRO CUADRADO. El precio total es
 * siempre la cifra principal; el $/m² va como dato secundario dentro de la ficha
 * de cada lote. Motivo en la regla 1 de src/data/lotes.ts.
 */

import {
  AREAS,
  PRECIOS,
  PRECIOS_M2,
  lotes,
  lotesDisponibles,
  nombreLote,
  type Lote,
} from "./lotes";

export interface Proyecto {
  nombre: string;
  ciudad: string;
  sector: string;
  departamento: string;
  pais: string;
  /** Cifra de campaña, fijada por el cliente. NO es el mínimo del inventario. */
  precioDesdeComercial: number;
  /** Cifra de campaña, fijada por el cliente. NO es el mínimo del inventario. */
  precioM2DesdeComercial: number;
  tiempoAGuatape: string;
  coordenadas: { lat: number; lng: number };
  googleMaps: string;
  tour360: string;
  whatsapp: string;
  whatsappDisplay: string;
  /** Constructora del proyecto. Fuente única de su nombre y su web. */
  constructora: { nombre: string; url: string };
  /** Agencia que hace el sitio. Fuente única de su nombre y su web. */
  agencia: { nombre: string; url: string };
  telefono: string;
  email: string;
  dominio: string;
  /** Razón social del RESPONSABLE del tratamiento. Ley 1581 de 2012, art. 13. */
  razonSocial: string;
  /** NIT del responsable, con dígito de verificación. */
  nit: string;
  /** Dirección física de notificaciones. La ley la exige; no es opcional. */
  direccionNotificaciones: string;
}

export const proyecto: Proyecto = {
  nombre: "Lotes Campestres Vista Hermosa",
  ciudad: "Guatapé",
  sector: "Vista Hermosa",
  departamento: "Antioquia",
  pais: "Colombia",

  // ─────────────────────────────────────────────────────────────────────────
  // CIFRAS DE CAMPAÑA — decisión comercial del cliente, NO cálculo
  //
  // Estas dos cifras son las que el cliente quiere comunicar en publicidad y en
  // el titular del hero. NO son el mínimo calculado del inventario y no deben
  // "corregirse" para que cuadren con él:
  //
  //   · mínimo real de precio total : $250.000.000 (La Culebra 01)
  //   · mínimo real de $/m²         : $10.990      (Vista Hermosa 01)
  //
  // Los dos mínimos reales los sostienen lotes atípicos —el más barato del
  // proyecto y el más grande, que abarata muchísimo el metro—, así que anunciar
  // esos números atraería tráfico que no encaja con el resto del inventario.
  // Las cifras de campaña son deliberadamente más altas y más representativas.
  //
  // TODO (REVISAR AL MARCAR UN LOTE COMO VENDIDO): si se vende La Culebra 01 o
  // Vista Hermosa 01, estas dos cifras DEJAN DE SER VÁLIDAS —desaparece el lote
  // que las respalda— y hay que revisarlas con el cliente antes de seguir
  // pautando. Anunciar un "desde" que ya no existe en el inventario es publicidad
  // engañosa.
  // ─────────────────────────────────────────────────────────────────────────
  precioDesdeComercial: 280_000_000, // COP — titular del hero
  precioM2DesdeComercial: 45_000, // COP/m² — cifra secundaria del hero

  tiempoAGuatape: "15 minutos", // dato del brochure oficial

  coordenadas: { lat: 6.210427, lng: -75.155184 },
  googleMaps: "https://maps.app.goo.gl/MdV9hd78RU64HLUR7",
  tour360: "https://tour.panoee.net/6a8c990e2745174f948f54f8/dji_0533",

  whatsapp: "573117637010",
  whatsappDisplay: "311 763 7010",

  // La firma que construye el proyecto. El enlace va SIN nofollow: es el
  // constructor real y el enlace es legítimo, no un intercambio publicitario.
  constructora: {
    nombre: "R&U Ingenieros",
    url: "https://ryuingenieros.com/",
  },

  // Quién hace el sitio. Es un crédito distinto del de la constructora y en el
  // footer van separados a propósito: R&U construye lotes, Growth Digital hace
  // la web. Juntarlos confunde quién hizo qué.
  agencia: {
    nombre: "Growth Digital",
    url: "https://growthdigital.marketing/",
  },

  // Línea fija comercial. Es DISTINTA del WhatsApp: el header, el footer y los
  // CTA siguen marcando el móvil de arriba, que es el canal de venta. Este
  // número aparece como teléfono de contacto del responsable en la política.
  telefono: "+57 311 318 1155",

  // Canal COMERCIAL, y es el que se publica. El correo que figura en el RUT
  // ante la DIAN es otro y NO se publica: no es un canal de atención y
  // exponerlo solo le trae spam a una cuenta administrativa.
  email: "comercial@ryuingenieros.com",

  dominio: "https://lotescampestresguatape.com",

  // ─────────────────────────────────────────────────────────────────────────
  // IDENTIDAD LEGAL DEL RESPONSABLE DEL TRATAMIENTO
  //
  // Fuente: RUT actualizado ante la DIAN. Representante legal: Sergio Andrés
  // Ríos Usuga. Con estos tres campos más `email` y `telefono`,
  // `datosLegalesCompletos` pasa a true y la política sale de borrador: se le
  // quita el noindex, desaparecen el aviso y los huecos, y se activan los
  // enlaces del footer y del consentimiento del formulario.
  //
  // El NIT va tal como figura en el RUT, sin reformatear con puntos de millar:
  // es un identificador, no una cifra.
  //
  // OJO: la razón social NO es "R&U Ingenieros" —así se llama la marca, y eso es
  // `constructora.nombre`—, sino la denominación societaria completa. En la
  // política tiene que ir la societaria, que es quien responde legalmente.
  // ─────────────────────────────────────────────────────────────────────────
  razonSocial: "R & U INGENIEROS S.A.S.",
  nit: "900673974-0",
  direccionNotificaciones:
    "Carrera 43 A # 1 Sur - 50, Oficina 1006, Medellín, Antioquia, Colombia",
};

/** Ruta de la política de tratamiento de datos. */
export const RUTA_POLITICA_DATOS = "/politica-de-tratamiento-de-datos/";

/** ¿Un campo sigue sin entregar? */
export function esPendiente(valor: string): boolean {
  return valor.trim() === "" || valor.startsWith("PENDIENTE");
}

/**
 * ¿La política se puede publicar ya?
 *
 * La Ley 1581 de 2012 (art. 13) y el Decreto 1074 de 2015 obligan a identificar
 * al responsable del tratamiento con nombre, domicilio y canales de atención. Si
 * falta cualquiera de los cinco, la política está incompleta: se sigue pudiendo
 * leer en su URL —para que el cliente la revise y la complete—, pero va con
 * noindex, con un aviso de borrador y SIN enlazarse desde el sitio.
 */
export const datosLegalesCompletos: boolean = [
  proyecto.razonSocial,
  proyecto.nit,
  proyecto.direccionNotificaciones,
  proyecto.email,
  proyecto.telefono,
].every((campo) => !esPendiente(campo));

/**
 * URL que enlazan el consentimiento del formulario y el footer.
 *
 * Vacía mientras la política sea un borrador: es preferible un checkbox de
 * consentimiento sin enlace que uno que lleve a un documento con huecos, que es
 * peor que no tenerlo —parece que hay política y no la hay—.
 */
export const urlPoliticaDatos: string = datosLegalesCompletos ? RUTA_POLITICA_DATOS : "";

/**
 * Inventario REAL, derivado de lotes.ts. Esto es lo que alimenta la barra de
 * datos, el JSON-LD y el rango de áreas del copy y la meta description.
 *
 * No escribir ninguna de estas cifras a mano en ningún componente.
 */
export const inventario = {
  totalLotes: lotes.length,
  disponibles: lotesDisponibles.length,
  areaMin: AREAS.min,
  areaMax: AREAS.max,
  precioMin: PRECIOS.min,
  precioMax: PRECIOS.max,
  precioM2Min: PRECIOS_M2.min,
  precioM2Max: PRECIOS_M2.max,
} as const;

/**
 * Distancias y tiempos al proyecto.
 * Los marcados con `pendiente: true` NO están confirmados por el cliente:
 * salen de estimaciones sobre la coordenada. Verificar antes de publicar.
 */
export interface Distancia {
  destino: string;
  valor: string;
  pendiente: boolean;
}

export const distancias: Distancia[] = [
  {
    destino: "Casco urbano de Guatapé",
    valor: "15 minutos",
    pendiente: false, // dato del brochure oficial
  },
  {
    destino: "Piedra del Peñol",
    valor: "≈ 2,8 km en línea recta",
    pendiente: true, // TODO: confirmar — cálculo desde la coordenada, no del cliente
  },
  {
    destino: "Medellín",
    valor: "≈ 1 h 20 min",
    pendiente: true, // TODO: confirmar con el cliente
  },
  {
    destino: "Aeropuerto José María Córdova",
    valor: "≈ 50 minutos",
    pendiente: true, // TODO: confirmar con el cliente
  },
];

/**
 * Formateo de moneda colombiana. Se usa en TODA la página: barra de datos,
 * fichas de lote, calculadora y el payload del formulario.
 */
const formateadorCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/**
 * "$560.000.000", sin espacio tras el símbolo.
 *
 * Intl con locale es-CO mete un espacio duro entre "$" y la cifra ("$ 560.000.000").
 * Es correcto tipográficamente, pero no es como se escribe un precio en
 * publicidad inmobiliaria colombiana ni como lo pidió el cliente, y en el
 * <title> el espacio se ve raro. Se quita el separador —espacio duro o normal—
 * sin tocar los puntos de millar, que sí son los del locale.
 */
export function formatearCOP(valor: number): string {
  return formateadorCOP.format(valor).replace(/\s/g, "");
}

/** Miles con separador colombiano, sin símbolo de moneda. Para áreas: "50.954" */
const formateadorNumero = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

export function formatearNumero(valor: number): string {
  return formateadorNumero.format(valor);
}

/**
 * Valor por m². Siempre recibe un número CALCULADO con `precioM2()`, nunca uno
 * escrito a mano, y se redondea al peso: "$10.990/m²".
 */
export function formatearValorM2(valor: number): string {
  return `${formatearCOP(Math.round(valor))}/m²`;
}

/**
 * Enlace de WhatsApp con mensaje precargado y URL-encoded.
 * Si el visitante venía de un lote concreto, el mensaje lo nombra con su predio
 * —"Vista Hermosa 01"—, porque el número solo es ambiguo: hay un 01 en cada
 * predio.
 */
export function enlaceWhatsApp(lote?: Lote | string): string {
  const base =
    "Hola, vi la página de Lotes Campestres Vista Hermosa en Guatapé y quiero más información.";
  const nombre = typeof lote === "string" ? lote : lote ? nombreLote(lote) : "";
  const mensaje = nombre ? `${base} Me interesa el lote ${nombre}.` : base;
  return `https://wa.me/${proyecto.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
