/**
 * Datos oficiales del proyecto. Fuente única de verdad para todo el sitio.
 *
 * REGLA DURA: estas cifras son las que entregó el cliente y mandan sobre
 * cualquier otra fuente. No se cruzan con el levantamiento topográfico
 * (Consultoría YJC) ni se recalculan — la numeración de ese levantamiento es
 * por predio y no coincide con la del brochure comercial.
 *
 * La unidad comercial es el METRO CUADRADO. Nunca se presenta un precio total
 * como cifra principal: se comunica el valor por m² y el visitante estima su
 * total con la calculadora de la sección de lotes.
 */

export interface Proyecto {
  nombre: string;
  ciudad: string;
  sector: string;
  departamento: string;
  pais: string;
  lotesDisponibles: number;
  areaMin: number;
  areaMax: number;
  precioM2Min: number;
  precioM2Max: number;
  precioM2Promedio: number;
  tiempoAGuatape: string;
  coordenadas: { lat: number; lng: number };
  googleMaps: string;
  tour360: string;
  whatsapp: string;
  whatsappDisplay: string;
  desarrolla: string;
  telefono: string;
  email: string;
  dominio: string;
}

export const proyecto: Proyecto = {
  nombre: "Lotes Campestres Vista Hermosa",
  ciudad: "Guatapé",
  sector: "Vista Hermosa",
  departamento: "Antioquia",
  pais: "Colombia",

  lotesDisponibles: 10,
  areaMin: 3500, // m²
  areaMax: 10000, // m²

  precioM2Min: 45000, // COP — lote de menor valor
  precioM2Max: 100000, // COP
  precioM2Promedio: 80000, // COP — cifra de referencia comercial

  tiempoAGuatape: "15 minutos", // dato del brochure oficial

  coordenadas: { lat: 6.210427, lng: -75.155184 },
  googleMaps: "https://maps.app.goo.gl/MdV9hd78RU64HLUR7",
  tour360: "https://tour.panoee.net/6a8c990e2745174f948f54f8/dji_0533",

  whatsapp: "573105145648",
  whatsappDisplay: "310 514 5648",

  desarrolla: "R&U Ingenieros",

  telefono: "PENDIENTE", // TODO: confirmar antes de publicar
  email: "PENDIENTE", // TODO: confirmar antes de publicar
  dominio: "https://lotescampestresguatape.com",
};

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
 * calculadora, cards de bandas de área y el payload del formulario.
 */
const formateadorCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearCOP(valor: number): string {
  return formateadorCOP.format(valor);
}

/** Miles con separador colombiano, sin símbolo de moneda. Para áreas: "3.500" */
const formateadorNumero = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

export function formatearNumero(valor: number): string {
  return formateadorNumero.format(valor);
}

/** Valor por m² tal como se comunica siempre: "$45.000/m²" */
export function formatearValorM2(valor: number): string {
  return `${formatearCOP(valor)}/m²`;
}

/**
 * Enlace de WhatsApp con mensaje precargado y URL-encoded.
 * Si el visitante venía de un lote específico, el mensaje lo incluye.
 */
export function enlaceWhatsApp(lote?: string | number): string {
  const base =
    "Hola, vi la página de Lotes Campestres Vista Hermosa en Guatapé y quiero más información.";
  const mensaje = lote ? `${base} Me interesa el lote ${lote}.` : base;
  return `https://wa.me/${proyecto.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
