import type { NombreIcono } from "../components/iconos";

/**
 * Especificaciones del proyecto.
 *
 * REGLA: solo se PUBLICA lo que está respaldado. Los ítems con
 * `confirmado: false` siguen aquí para no perderlos de vista, pero el
 * componente NO los pinta. Publicar "agua y energía" sin que el cliente lo haya
 * confirmado es prometer algo que quizá no exista, y en venta de lotes eso se
 * paga caro.
 *
 * Los tres confirmados lo están porque su texto viene de los captions del
 * manifiesto de imágenes, que son copy aprobado por el cliente.
 */

export interface Especificacion {
  icono: NombreIcono;
  titulo: string;
  detalle: string;
  /** false = no se publica hasta que el cliente lo confirme */
  confirmado: boolean;
}

export const especificaciones: Especificacion[] = [
  {
    icono: "via",
    titulo: "Acceso vehicular hasta el lote",
    detalle: "Vía de acceso que llega directamente a cada uno de los lotes.",
    confirmado: true, // caption del manifiesto: "Acceso vehicular directo hasta cada lote"
  },
  {
    icono: "montana",
    titulo: "Topografía apta para construir",
    detalle: "Terreno de pendiente suave, apto para casa campestre.",
    confirmado: true, // caption del manifiesto: "Topografía suave, apta para construcción"
  },
  {
    icono: "bosque",
    titulo: "Bosque nativo conservado",
    detalle: "El proyecto mantiene la vegetación nativa dentro del predio.",
    confirmado: true, // caption del manifiesto: "Bosque nativo conservado dentro del proyecto"
  },

  // ── Pendientes de confirmación: NO se publican todavía ────────────────────
  {
    icono: "energia",
    titulo: "Energía eléctrica",
    detalle: "Disponibilidad de conexión eléctrica por lote.",
    confirmado: false, // TODO: confirmar con el cliente antes de publicar
  },
  {
    icono: "agua",
    titulo: "Agua",
    detalle: "Fuente y condiciones de abastecimiento de agua por lote.",
    confirmado: false, // TODO: confirmar con el cliente antes de publicar
  },
  {
    icono: "documento",
    titulo: "Escrituración individual",
    detalle: "Cada lote se escritura de forma independiente.",
    confirmado: false, // TODO: confirmar el estado real del trámite
  },
  {
    icono: "documento",
    titulo: "Radicado en Planeación Municipal",
    detalle: "Proyecto radicado ante Planeación Municipal de Guatapé.",
    confirmado: false, // TODO: confirmar el estado de la licencia
  },
];

/** Lo único que se pinta en la página. */
export const especificacionesPublicables = especificaciones.filter((e) => e.confirmado);

/**
 * Bloques de "Por qué Guatapé".
 *
 * PROHIBIDO hablar de rentabilidad, valorización o retorno: es publicidad
 * inmobiliaria en Colombia. Aquí se habla del entorno y de los atributos del
 * lugar, nada más.
 */
export interface BloqueEntorno {
  titulo: string;
  texto: string;
}

export const porQueGuatape: BloqueEntorno[] = [
  {
    titulo: "El embalse a la vista",
    texto:
      "El proyecto mira al embalse del Peñol-Guatapé, el paisaje de agua y montaña que define la zona. Desde los lotes se ve el espejo de agua y, al fondo, la Piedra del Peñol.",
  },
  {
    titulo: "Un destino consolidado",
    texto:
      "Guatapé es uno de los pueblos más visitados de Antioquia, con su malecón, sus zócalos de colores y la Piedra del Peñol. No es un lugar por descubrir: es un destino que ya funciona todo el año.",
  },
  {
    titulo: "Cerca de todo lo que importa",
    texto:
      "A 15 minutos del casco urbano de Guatapé, con Medellín y el Aeropuerto José María Córdova a distancia de viaje corto por la autopista Medellín-Bogotá.",
  },
];
