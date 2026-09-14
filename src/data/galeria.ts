/**
 * Galería — generado a partir de imagenes.json.
 *
 * REGLA DURA: los textos `alt` y `caption` se copian LITERALMENTE del manifiesto.
 * Están redactados en español con las keywords del proyecto y son parte del SEO:
 * no se reescriben, no se "mejoran" y no se traducen.
 *
 * Los nombres de archivo tampoco se renombran: ya vienen optimizados para SEO.
 * Los assets están pre-generados en WebP a 600/1200/1920 px y NO se recomprimen.
 */

export type GrupoGaleria = "fotos" | "renders";

export interface ItemGaleria {
  /** Ruta sin sufijo de tamaño ni extensión, relativa a /img/ */
  base: string;
  grupo: GrupoGaleria;
  alt: string;
  caption: string;
  /** Dimensiones reales del archivo de 1200 px. Obligatorias para fijar la caja
   *  con width/height y no generar CLS. La proporción es la misma en los tres tamaños. */
  ancho: number;
  alto: number;
}

/** Tamaños disponibles de cada imagen de galería. */
export const TAMANOS = [600, 1200, 1920] as const;
export type Tamano = (typeof TAMANOS)[number];

/** Ruta a un tamaño concreto: src("fotos/…", 1200) → "/img/fotos/…-1200.webp" */
export function src(base: string, tamano: Tamano = 1200): string {
  return `/img/${base}-${tamano}.webp`;
}

/** srcset con los tres tamaños, para dejar que el navegador elija. */
export function srcset(base: string): string {
  return TAMANOS.map((t) => `${src(base, t)} ${t}w`).join(", ");
}

/** Alto proporcional de un item en un ancho dado. Evita CLS al cambiar de tamaño. */
export function altoProporcional(item: ItemGaleria, ancho: number): number {
  return Math.round((item.alto / item.ancho) * ancho);
}

/** ¿Lleva el sello "Render ilustrativo"? Todo lo que no sea fotografía real. */
export function esRender(item: ItemGaleria): boolean {
  return item.grupo === "renders";
}

/**
 * NOTA sobre `render-implantacion-lotes-vista-hermosa-guatape`: imagenes.json lo
 * declara `"orientacion": "vertical"`, pero el archivo real mide 1200×953, que es
 * horizontal. Aquí manda el pixel, porque de él dependen width/height y el CLS.
 * Aun así es el más estrecho del grupo, así que en el mosaico ocupa un hueco
 * angosto — que es, presumiblemente, lo que el manifiesto quería expresar.
 */
export const galeria: ItemGaleria[] = [
  {
    base: "fotos/vista-embalse-guatape-piedra-del-penol-desde-lotes",
    grupo: "fotos",
    alt: "Vista aérea del embalse de Guatapé y la Piedra del Peñol desde los lotes campestres Vista Hermosa",
    caption: "El embalse y la Piedra del Peñol al frente del proyecto",
    ancho: 1200,
    alto: 800,
  },
  {
    base: "fotos/panoramica-aerea-lotes-guatape-piedra-del-penol",
    grupo: "fotos",
    alt: "Panorámica aérea del sector Vista Hermosa en Guatapé con la Piedra del Peñol al fondo",
    caption: "Sector Vista Hermosa, a minutos del casco urbano de Guatapé",
    ancho: 1200,
    alto: 800,
  },
  {
    base: "fotos/lotes-campestres-vista-hermosa-guatape-atardecer",
    grupo: "fotos",
    alt: "Lotes campestres Vista Hermosa en Guatapé al atardecer con montañas de fondo",
    caption: "Atardecer sobre el lote",
    ancho: 1200,
    alto: 800,
  },
  {
    base: "fotos/vista-aerea-terreno-lotes-vista-hermosa-guatape",
    grupo: "fotos",
    alt: "Vista aérea del terreno donde se desarrollan los lotes campestres Vista Hermosa en Guatapé",
    caption: "Topografía suave, apta para construcción",
    ancho: 1200,
    alto: 800,
  },
  {
    base: "fotos/topografia-lotes-campestres-guatape-vista-cenital",
    grupo: "fotos",
    alt: "Vista cenital de la topografía de los lotes campestres en Guatapé, Antioquia",
    caption: "Vista cenital del predio",
    ancho: 1200,
    alto: 800,
  },
  {
    base: "fotos/bosque-nativo-lotes-campestres-guatape",
    grupo: "fotos",
    alt: "Bosque nativo dentro del proyecto de lotes campestres Vista Hermosa en Guatapé",
    caption: "Bosque nativo conservado dentro del proyecto",
    ancho: 1200,
    alto: 800,
  },
  {
    base: "fotos/via-acceso-lotes-vista-hermosa-guatape",
    grupo: "fotos",
    alt: "Vía de acceso a los lotes campestres Vista Hermosa en Guatapé, Antioquia",
    caption: "Acceso vehicular directo hasta cada lote",
    ancho: 1200,
    alto: 800,
  },
  {
    base: "renders/render-camino-principal-lotes-vista-hermosa-guatape",
    grupo: "renders",
    alt: "Render del camino principal iluminado del proyecto Lotes Campestres Vista Hermosa en Guatapé",
    caption: "Render: vía interna iluminada del proyecto",
    ancho: 1200,
    alto: 675,
  },
  {
    base: "renders/render-atardecer-lotes-campestres-guatape",
    grupo: "renders",
    alt: "Render al atardecer de los lotes campestres Vista Hermosa en Guatapé, Antioquia",
    caption: "Render: atardecer sobre el proyecto",
    ancho: 1200,
    alto: 675,
  },
  {
    base: "renders/render-entrada-lotes-vista-hermosa-guatape",
    grupo: "renders",
    alt: "Render de la entrada al proyecto de lotes campestres Vista Hermosa en Guatapé",
    caption: "Render: llegada al proyecto",
    ancho: 1200,
    alto: 675,
  },
  {
    base: "renders/render-aereo-proyecto-lotes-campestres-guatape",
    grupo: "renders",
    alt: "Render aéreo del proyecto Lotes Campestres Vista Hermosa en Guatapé con sus casas campestres",
    caption: "Render aéreo del conjunto",
    ancho: 1200,
    alto: 675,
  },
  {
    base: "renders/render-vias-internas-lotes-guatape",
    grupo: "renders",
    alt: "Render de las vías internas y la distribución de los lotes campestres en Guatapé",
    caption: "Render: trazado de vías internas",
    ancho: 1200,
    alto: 675,
  },
  {
    base: "renders/render-implantacion-lotes-vista-hermosa-guatape",
    grupo: "renders",
    alt: "Render de implantación general del proyecto Lotes Campestres Vista Hermosa en Guatapé",
    caption: "Render: implantación general",
    ancho: 1200,
    alto: 953,
  },
];

/**
 * Pestañas de la galería. SON DOS, y "fotos" va primero y activa por defecto.
 *
 * No hay pestaña "Todo": mezclar fotografía real con renders en una misma tira
 * deja al visitante sin saber qué está mirando. La fotografía es la que prueba
 * que el lote existe; el render es una promesa. Se muestran por separado y la
 * prueba va primero.
 */
export interface GrupoConItems {
  id: GrupoGaleria;
  etiqueta: string;
  /** Etiqueta accesible del slider de esta pestaña */
  descripcion: string;
  items: ItemGaleria[];
}

export const gruposGaleria: GrupoConItems[] = [
  {
    id: "fotos",
    etiqueta: "Fotografía real",
    descripcion: "Fotografías reales del proyecto",
    items: galeria.filter((i) => i.grupo === "fotos"),
  },
  {
    id: "renders",
    etiqueta: "Renders del proyecto",
    descripcion: "Renders ilustrativos del proyecto",
    items: galeria.filter((i) => i.grupo === "renders"),
  },
];

/** Imagen del hero. Es el LCP: va con loading="eager" y fetchpriority="high". */
export const hero = galeria[0]!;

/** Panorámicas equirectangulares. Solo existen en 2400 px. Se usan como
 *  facade del recorrido 360°: el iframe del tour se inyecta al hacer clic. */
export interface Panoramica {
  src: string;
  alt: string;
}

export const panoramicas: Panoramica[] = [
  {
    src: "/img/pano/panoramica-360-lotes-vista-hermosa-guatape-1-2400.webp",
    alt: "Panorámica 360 grados desde los lotes campestres Vista Hermosa en Guatapé",
  },
  {
    src: "/img/pano/panoramica-360-lotes-vista-hermosa-guatape-2-2400.webp",
    alt: "Panorámica 360 grados del terreno de los lotes campestres en Guatapé, Antioquia",
  },
  {
    src: "/img/pano/panoramica-360-lotes-vista-hermosa-guatape-3-2400.webp",
    alt: "Panorámica 360 grados del sector Vista Hermosa en Guatapé con vista al embalse",
  },
];

/** Logo, en sus tres presentaciones. */
export const logo = {
  principal: {
    src: "/img/logo/logo-vista-hermosa-guatape-512.webp",
    src192: "/img/logo/logo-vista-hermosa-guatape-192.webp",
    alt: "Logo Lotes Campestres Vista Hermosa Guatapé",
  },
  /**
   * Emblema circular recortado del logo dorado. El lockup completo es vertical
   * y su texto se vuelve ilegible por debajo de ~120 px de alto, así que en el
   * header se usa solo el emblema y el nombre se compone como texto.
   */
  emblema: {
    src: "/img/logo/logo-vista-hermosa-guatape-emblema-dorado-160.webp",
    alt: "Emblema de Vista Hermosa Guatapé: montaña y embalse",
    ancho: 174,
    alto: 160,
  },
  /** Sobre fondos verde oscuro o fotografías con overlay: header y footer. */
  dorado: {
    src: "/img/logo/logo-vista-hermosa-guatape-dorado-800.webp",
    alt: "Logo Vista Hermosa Guatapé en dorado",
  },
  favicon: "/img/logo/favicon-32.png",
  appleTouchIcon: "/img/logo/apple-touch-icon.png",
} as const;

/**
 * Logo de la constructora, para el crédito del footer.
 *
 * Es la versión con el texto en crema, no la de color: el footer es verde-900 y
 * la de color no se lee ahí. Los archivos vienen del cliente y NO se recomprimen
 * ni se convierten; `ancho`/`alto` son las dimensiones reales del archivo de
 * 600 px y fijan la proporción para que el logo no genere CLS al cargar.
 *
 * El nombre y la URL NO están aquí: viven en `proyecto.constructora`, que es su
 * fuente única. Aquí solo el asset.
 */
export const logoConstructora = {
  src: "/img/logo/logo-ru-ingenieros-600.webp",
  srcset:
    "/img/logo/logo-ru-ingenieros-300.webp 300w, /img/logo/logo-ru-ingenieros-600.webp 600w",
  alt: "R&U Ingenieros, constructora del proyecto Lotes Campestres Vista Hermosa",
  ancho: 600,
  alto: 467,
} as const;

export const ogImage = {
  jpg: "/img/og-image-lotes-vista-hermosa-guatape.jpg",
  webp: "/img/og-image-lotes-vista-hermosa-guatape.webp",
  ancho: 1200,
  alto: 630,
} as const;
