/**
 * Paths de los íconos SVG, dibujados a mano. Sin librería de íconos.
 *
 * Viven en un .ts y no dentro de Icono.astro para que el tipo `NombreIcono` se
 * pueda importar desde cualquier componente y el nombre del ícono quede
 * verificado en tiempo de compilación.
 *
 * Todos usan viewBox 0 0 24 24 y heredan el color con `currentColor`.
 */

/** Íconos de trazo: heredan grosor y color, se ven bien a cualquier tamaño. */
export const iconosTrazo = {
  // Parcelas delimitadas: la idea de "lotes" sin recurrir a una casa
  lotes: `<path d="M3 4.5 10.5 3v7.5H3z"/><path d="M13.5 3 21 4.5V12h-7.5z"/><path d="M3 13.5h7.5V21L3 19.5z"/><path d="M13.5 15h7.5v4.5L13.5 21z"/>`,
  // Flechas a las cuatro esquinas: superficie
  area: `<path d="M3 9V3h6"/><path d="M21 9V3h-6"/><path d="M3 15v6h6"/><path d="M21 15v6h-6"/><path d="M3 3l5.5 5.5"/><path d="M21 3l-5.5 5.5"/><path d="M3 21l5.5-5.5"/><path d="M21 21l-5.5-5.5"/>`,
  // Etiqueta de precio
  precio: `<path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0l-6.4-6.4a2 2 0 0 1-.6-1.5l.3-6.1a2 2 0 0 1 1.9-1.9l6.1-.3a2 2 0 0 1 1.5.6l6.4 6.4a2 2 0 0 1 0 2.8z"/><circle cx="8.5" cy="8.5" r="1.4"/>`,
  reloj: `<circle cx="12" cy="12" r="9"/><path d="M12 6.75V12l3.5 2"/>`,
  mapa: `<path d="M20 10.5c0 5.2-6.4 10.2-7.6 11.1a.7.7 0 0 1-.8 0C10.4 20.7 4 15.7 4 10.5a8 8 0 1 1 16 0z"/><circle cx="12" cy="10.3" r="2.8"/>`,
  menu: `<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>`,
  telefono: `<path d="M6.5 3h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 6.2 2 2 0 0 1 6 4z"/>`,
  // Especificaciones
  via: `<path d="M4 21 8.5 3"/><path d="M20 21 15.5 3"/><path d="M12 4.5v2.5"/><path d="M12 10.5v3"/><path d="M12 17v2.5"/>`,
  montana: `<path d="M3 19h18"/><path d="m5 19 5.5-11 3 5.5 2-3L21 19"/>`,
  bosque: `<path d="M12 3 7 11h3l-3.5 5.5h11L14 11h3z"/><path d="M12 16.5V21"/>`,
  documento: `<path d="M14 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V7.6z"/><path d="M14 3v4.6h4.6"/><path d="M9 13h6"/><path d="M9 16.5h4"/>`,
  agua: `<path d="M12 3.5c3.2 3.6 5.5 6.3 5.5 9.1A5.5 5.5 0 0 1 6.5 12.6c0-2.8 2.3-5.5 5.5-9.1z"/>`,
  energia: `<path d="M13.5 2.5 5 13.5h5.5L9.5 21.5 18 10.5h-5.5z"/>`,
  cerrar: `<path d="M6 6l12 12"/><path d="M18 6 6 18"/>`,
  "flecha-abajo": `<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>`,
} as const;

/** Íconos de relleno. */
export const iconosRelleno = {
  // Glifo oficial de WhatsApp, como path propio. Nunca una imagen ni un script
  // de terceros: es una pieza de marca y debe poder ir en dorado.
  whatsapp: `<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>`,
  play: `<path d="M8 5.2v13.6a.8.8 0 0 0 1.22.68l11-6.8a.8.8 0 0 0 0-1.36l-11-6.8A.8.8 0 0 0 8 5.2z"/>`,
} as const;

export type NombreIconoTrazo = keyof typeof iconosTrazo;
export type NombreIconoRelleno = keyof typeof iconosRelleno;
export type NombreIcono = NombreIconoTrazo | NombreIconoRelleno;

export function esIconoDeRelleno(nombre: NombreIcono): nombre is NombreIconoRelleno {
  return nombre in iconosRelleno;
}

export function pathDe(nombre: NombreIcono): string {
  return esIconoDeRelleno(nombre) ? iconosRelleno[nombre] : iconosTrazo[nombre];
}
