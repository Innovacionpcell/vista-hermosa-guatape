import { proyecto, formatearValorM2 } from "./proyecto";

/**
 * FAQ — 8 preguntas orientadas a búsquedas reales. Alimenta el acordeón y el
 * bloque JSON-LD FAQPage, así que las respuestas se publican tal cual.
 *
 * REGLA: ninguna respuesta afirma algo que el cliente no haya confirmado.
 * Donde el dato no está verificado, la respuesta lo reconoce y deriva a WhatsApp
 * en vez de inventar. Eso además convierte: una pregunta sin responder del todo
 * es una excusa legítima para abrir conversación.
 *
 * PROHIBIDO en cualquier respuesta: rentabilidad, valorización, retorno,
 * "inversión segura" o cualquier promesa de rendimiento. Es publicidad
 * inmobiliaria en Colombia; se habla de atributos del lote y del entorno.
 */

export interface PreguntaFaq {
  pregunta: string;
  /** Texto plano. Se usa igual en el acordeón y en el JSON-LD. */
  respuesta: string;
  /**
   * true = la respuesta está redactada para NO afirmar lo que no está
   * confirmado, y hay que revisarla cuando el cliente entregue el dato.
   */
  pendienteConfirmar?: boolean;
}

export const faq: PreguntaFaq[] = [
  {
    pregunta: "¿Cuánto cuesta el metro cuadrado en Guatapé?",
    respuesta: `En Lotes Campestres Vista Hermosa el valor parte de ${formatearValorM2(
      proyecto.precioM2Min,
    )}, con un promedio de referencia de ${formatearValorM2(
      proyecto.precioM2Promedio,
    )}. El valor exacto depende del lote y de su ubicación dentro del proyecto. Puedes estimar tu inversión con la calculadora de esta página y escribirnos para conocer el valor del lote que te interese.`,
  },
  {
    pregunta: "¿Cuál es el área mínima de los lotes?",
    respuesta:
      "Las áreas van desde 3.500 m² hasta 10.000 m². La unidad de venta es el metro cuadrado, así que defines el área que necesitas dentro de ese rango y el valor total se calcula sobre ella.",
  },
  {
    pregunta: "¿Se puede construir en los lotes?",
    respuesta:
      "Sí. La topografía del predio es suave y apta para construcción, y hay acceso vehicular directo hasta cada lote. Las condiciones específicas de construcción —índices, retiros y permisos— las define Planeación Municipal de Guatapé según el lote. Escríbenos y revisamos tu caso.",
  },
  {
    pregunta: "¿Los lotes se pueden escriturar de forma individual?",
    respuesta:
      "La escrituración individual hace parte del alcance del proyecto. Escríbenos por WhatsApp y te confirmamos el estado del trámite para el lote que te interese.",
    // TODO: confirmar con el cliente el estado real de la escrituración individual
    // y, si está resuelto, reescribir la respuesta en afirmativo.
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿Cómo llego a los lotes desde Medellín?",
    respuesta:
      "El proyecto está en el sector Vista Hermosa, a 15 minutos del casco urbano de Guatapé. Desde Medellín el trayecto toma aproximadamente una hora y veinte minutos por la autopista Medellín–Bogotá, y desde el Aeropuerto José María Córdova, unos 50 minutos. En esta página puedes abrir la ubicación exacta en Google Maps.",
    // TODO: los tiempos desde Medellín y el aeropuerto son estimaciones sobre la
    // coordenada, no datos entregados por el cliente. Confirmar antes de publicar.
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿Los lotes cuentan con servicios públicos?",
    respuesta:
      "Cada lote cuenta con vía de acceso vehicular hasta el predio. Para el detalle de energía y agua según el lote, escríbenos por WhatsApp y te damos la información actualizada.",
    // TODO: confirmar disponibilidad y condiciones de energía y agua por lote.
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿Se acepta financiación o pago por cuotas?",
    respuesta: `Las condiciones de pago se acuerdan directamente con ${proyecto.desarrolla}, la firma que desarrolla el proyecto. Escríbenos por WhatsApp al ${proyecto.whatsappDisplay} y te contamos las alternativas disponibles para el lote que te interese.`,
    // TODO: confirmar si existe plan de financiación y sus condiciones.
    pendienteConfirmar: true,
  },
  {
    pregunta: "¿Cómo agendo una visita al proyecto?",
    respuesta: `Escríbenos por WhatsApp al ${proyecto.whatsappDisplay} o déjanos tus datos en el formulario de esta página y coordinamos la visita. Antes de ir puedes recorrer el terreno con el recorrido virtual 360° para llegar con una idea clara de las vistas y la topografía.`,
  },
];

/**
 * Bloque JSON-LD FAQPage. Se construye desde el mismo arreglo que pinta el
 * acordeón, así que el schema y lo que ve el usuario nunca se desincronizan
 * —que es justo lo que Google penaliza—.
 */
export function faqSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.pregunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.respuesta,
      },
    })),
  };
}
