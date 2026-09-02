import { useEffect, useRef, useState } from "react";
import { opcionesAreaInteres } from "../data/lotes";
import { formatearCOP, proyecto } from "../data/proyecto";

/**
 * ¿Hay endpoint de servidor disponible?
 *
 * Hoy NO: el sitio es 100 % estático porque el adaptador de Node partía la
 * salida en dist/client + dist/server y tumbaba producción con un 403.
 * Mientras tanto el formulario entrega el lead por WhatsApp, que en un sitio
 * estático funciona y no pierde a nadie.
 *
 * Para activarlo, además de reactivar el endpoint (ver src/server/
 * lead-endpoint.ts), basta definir PUBLIC_BACKEND_LEADS=1 en el panel: este
 * componente pasa a hacer POST a /api/lead sin tocar una línea de código.
 */
const HAY_BACKEND = import.meta.env.PUBLIC_BACKEND_LEADS === "1";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Formulario de lead. Isla React con client:visible.
 *
 * Aquí React sí se gana su sitio: seis campos con validación por campo, estado
 * de envío, errores accesibles y tres orígenes distintos de precarga (plano,
 * bandas de área y calculadora). Hacerlo a mano sería más código y más frágil.
 *
 * La validación de cliente es cortesía para el visitante, NO seguridad: la que
 * cuenta está en /api/lead, porque cualquiera puede saltarse esta.
 */

interface Campos {
  nombre: string;
  whatsapp: string;
  email: string;
  area_interes: string;
  mensaje: string;
  consentimiento: boolean;
}

type Errores = Partial<Record<keyof Campos | "general", string>>;

const VACIO: Campos = {
  nombre: "",
  whatsapp: "",
  email: "",
  area_interes: "sin-definir",
  mensaje: "",
  consentimiento: false,
};

/** Espejo de la validación del servidor, para avisar antes de enviar. */
function validarCampo(nombre: keyof Campos, valor: string | boolean): string | undefined {
  if (nombre === "nombre") {
    if (String(valor).trim().length < 2) return "Escribe tu nombre completo.";
  }
  if (nombre === "whatsapp") {
    const digitos = String(valor).replace(/\D/g, "");
    const nacional = digitos.startsWith("57") && digitos.length === 12 ? digitos.slice(2) : digitos;
    if (nacional.length !== 10 || !nacional.startsWith("3")) {
      return "Escribe un celular colombiano de 10 dígitos, empezando por 3.";
    }
  }
  if (nombre === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(valor).trim())) {
      return "Escribe un correo válido.";
    }
  }
  if (nombre === "consentimiento" && valor !== true) {
    return "Necesitamos tu autorización para contactarte.";
  }
  return undefined;
}

function leerAtribucion(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem("vh:atribucion") || "{}");
  } catch {
    return {};
  }
}

export interface Props {
  /** URL de la política de tratamiento de datos. Si es "PENDIENTE" no se enlaza. */
  politicaUrl: string;
}

export default function FormularioLead({ politicaUrl }: Props) {
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [tocados, setTocados] = useState<Partial<Record<keyof Campos, boolean>>>({});
  const [enviando, setEnviando] = useState(false);

  /* Precarga desde el plano y la calculadora */
  const [loteInteres, setLoteInteres] = useState("");
  const [valorM2, setValorM2] = useState<number | null>(null);
  const [inversion, setInversion] = useState<number | null>(null);

  /** Momento en que se pintó el formulario: el servidor rechaza < 3 s. */
  const ts = useRef(Date.now());
  const seccion = useRef<HTMLDivElement>(null);
  /** Honeypot: se lee su valor REAL al enviar. Mandar "" fijo lo dejaría
   *  decorativo, porque el bot rellena el DOM y nosotros ignoraríamos el dato. */
  const honeypot = useRef<HTMLInputElement>(null);

  /* Escucha lo que emiten el plano, las bandas y la calculadora. Gracias a
     esto el lead llega al CRM con área y presupuesto que definió el visitante. */
  useEffect(() => {
    function alLote(e: Event) {
      const d = (e as CustomEvent<{ lote: string }>).detail;
      if (d?.lote) setLoteInteres(d.lote);
    }
    function alArea(e: Event) {
      const d = (e as CustomEvent<{ banda: string }>).detail;
      if (d?.banda) setCampos((c) => ({ ...c, area_interes: d.banda }));
    }
    function alCotizar(e: Event) {
      const d = (e as CustomEvent<{ area: number; valorM2: number; total: number; lote: string | null }>)
        .detail;
      if (!d) return;
      setValorM2(d.valorM2);
      setInversion(d.total);
      if (d.lote) setLoteInteres(d.lote);
      setCampos((c) => ({ ...c, area_interes: bandaDeArea(d.area) }));
    }
    window.addEventListener("vh:lote-seleccionado", alLote);
    window.addEventListener("vh:area-preseleccionada", alArea);
    window.addEventListener("vh:cotizacion", alCotizar);
    return () => {
      window.removeEventListener("vh:lote-seleccionado", alLote);
      window.removeEventListener("vh:area-preseleccionada", alArea);
      window.removeEventListener("vh:cotizacion", alCotizar);
    };
  }, []);

  /* `lead_form_view` cuando el formulario entra de verdad en pantalla */
  useEffect(() => {
    const nodo = seccion.current;
    if (!nodo) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: "lead_form_view" });
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(nodo);
    return () => obs.disconnect();
  }, []);

  function actualizar<K extends keyof Campos>(clave: K, valor: Campos[K]) {
    setCampos((c) => ({ ...c, [clave]: valor }));
    // Un error solo se limpia cuando el campo pasa a ser válido: si se borrara
    // al primer teclazo, el mensaje parpadearía en cada pulsación.
    if (errores[clave] && !validarCampo(clave, valor)) {
      setErrores((e) => ({ ...e, [clave]: undefined }));
    }
  }

  function alSalir(clave: keyof Campos) {
    setTocados((t) => ({ ...t, [clave]: true }));
    setErrores((e) => ({ ...e, [clave]: validarCampo(clave, campos[clave]) }));
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    const nuevos: Errores = {};
    (["nombre", "whatsapp", "email", "consentimiento"] as const).forEach((k) => {
      const error = validarCampo(k, campos[k]);
      if (error) nuevos[k] = error;
    });

    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      setTocados({ nombre: true, whatsapp: true, email: true, consentimiento: true });
      // El foco va al primer campo con error: sin esto, en móvil el mensaje
      // puede quedar fuera de pantalla y el envío parece no hacer nada.
      const primero = Object.keys(nuevos)[0];
      document.getElementById(`campo-${primero}`)?.focus();
      return;
    }

    window.dataLayer = window.dataLayer || [];

    if (!HAY_BACKEND) {
      /* Entrega por WhatsApp.
         La navegación va DENTRO del gesto del usuario y sin ningún await
         delante: si esperásemos a una promesa, el navegador dejaría de
         considerarlo una acción del usuario y el bloqueador de ventanas la
         cortaría en silencio, que es el peor fallo posible en un formulario.
         Si aun así se bloqueara la pestaña nueva, /gracias tiene su propio
         botón de WhatsApp, así que el visitante nunca queda sin salida. */
      window.dataLayer.push({
        event: "lead_form_submit",
        canal: "whatsapp",
        area_interes: campos.area_interes,
        lote: loteInteres || null,
        inversion_estimada: inversion,
      });
      window.open(enlaceConDatos(), "_blank", "noopener");
      window.location.href = "/gracias";
      return;
    }

    setEnviando(true);
    setErrores({});

    try {
      const respuesta = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campos,
          lote_interes: loteInteres,
          valor_m2_estimado: valorM2,
          inversion_estimada: inversion,
          website: honeypot.current?.value ?? "", // lo rellenan los bots, no el usuario
          ts: ts.current,
          ...leerAtribucion(),
        }),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok || !datos.ok) {
        if (datos.errores) {
          setErrores(datos.errores);
        } else {
          setErrores({
            general:
              datos.mensaje ||
              "No pudimos enviar tus datos. Inténtalo de nuevo o escríbenos por WhatsApp.",
          });
        }
        setEnviando(false);
        return;
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "lead_form_submit",
        area_interes: campos.area_interes,
        lote: loteInteres || null,
        inversion_estimada: inversion,
      });

      window.location.href = "/gracias";
    } catch {
      setErrores({
        general:
          "No pudimos conectar. Revisa tu conexión o escríbenos por WhatsApp.",
      });
      setEnviando(false);
    }
  }

  /** Mensaje de WhatsApp con los datos ya cualificados del visitante. */
  function enlaceConDatos(): string {
    const lineas = [
      "Hola, quiero informacion sobre los Lotes Campestres Vista Hermosa en Guatape.",
      "",
      `Nombre: ${campos.nombre}`,
      `Correo: ${campos.email}`,
      `Celular: ${campos.whatsapp}`,
      `Area de interes: ${etiquetaArea(campos.area_interes)}`,
    ];
    if (loteInteres) lineas.push(`Lote de interes: ${loteInteres}`);
    if (inversion && valorM2) {
      lineas.push(`Inversion estimada: ${formatearCOP(inversion)} a ${formatearCOP(valorM2)}/m2`);
    }
    if (campos.mensaje.trim()) lineas.push("", `Mensaje: ${campos.mensaje.trim()}`);

    return `https://wa.me/${proyecto.whatsapp}?text=${encodeURIComponent(lineas.join("\n"))}`;
  }

  const hayPolitica = politicaUrl && !politicaUrl.startsWith("PENDIENTE");

  return (
    <div ref={seccion}>
      <form onSubmit={enviar} noValidate className="space-y-6">
        {/* Honeypot: fuera de pantalla y fuera del recorrido de teclado y
            lectores. Un humano no puede rellenarlo; un bot lo rellena todo. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="campo-website">No rellenar</label>
          <input
            ref={honeypot}
            id="campo-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Campo
          id="nombre"
          etiqueta="Nombre completo"
          error={tocados.nombre ? errores.nombre : undefined}
        >
          <input
            id="campo-nombre"
            type="text"
            autoComplete="name"
            value={campos.nombre}
            onChange={(e) => actualizar("nombre", e.currentTarget.value)}
            onBlur={() => alSalir("nombre")}
            aria-invalid={Boolean(tocados.nombre && errores.nombre)}
            aria-describedby={errores.nombre ? "error-nombre" : undefined}
            className={entrada(Boolean(tocados.nombre && errores.nombre))}
          />
        </Campo>

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo
            id="whatsapp"
            etiqueta="WhatsApp"
            error={tocados.whatsapp ? errores.whatsapp : undefined}
          >
            <input
              id="campo-whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="310 514 5648"
              value={campos.whatsapp}
              onChange={(e) => actualizar("whatsapp", e.currentTarget.value)}
              onBlur={() => alSalir("whatsapp")}
              aria-invalid={Boolean(tocados.whatsapp && errores.whatsapp)}
              aria-describedby={errores.whatsapp ? "error-whatsapp" : undefined}
              className={entrada(Boolean(tocados.whatsapp && errores.whatsapp))}
            />
          </Campo>

          <Campo id="email" etiqueta="Correo" error={tocados.email ? errores.email : undefined}>
            <input
              id="campo-email"
              type="email"
              autoComplete="email"
              value={campos.email}
              onChange={(e) => actualizar("email", e.currentTarget.value)}
              onBlur={() => alSalir("email")}
              aria-invalid={Boolean(tocados.email && errores.email)}
              aria-describedby={errores.email ? "error-email" : undefined}
              className={entrada(Boolean(tocados.email && errores.email))}
            />
          </Campo>
        </div>

        <Campo id="area_interes" etiqueta="Área de interés">
          <select
            id="campo-area_interes"
            value={campos.area_interes}
            onChange={(e) => actualizar("area_interes", e.currentTarget.value)}
            className={entrada(false)}
          >
            {opcionesAreaInteres.map((o) => (
              <option key={o.valor} value={o.valor} className="bg-verde-900">
                {o.etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        {/* Resumen de lo que el visitante configuró antes de llegar aquí.
            Se muestra para que vea que su selección viajó con él; los valores
            van al CRM en campos ocultos. */}
        {(loteInteres || inversion) && (
          <div className="flex flex-wrap gap-2 rounded-sm border border-dorado-500/25 bg-verde-900/40 px-4 py-3">
            {loteInteres && (
              <span className="font-sans text-xs text-crema/70">
                Lote <strong className="text-dorado-400">{loteInteres}</strong>
              </span>
            )}
            {inversion && valorM2 && (
              <span className="font-sans text-xs text-crema/70">
                · Estimado <strong className="text-dorado-400">{formatearCOP(inversion)}</strong> a{" "}
                {formatearCOP(valorM2)}/m²
              </span>
            )}
          </div>
        )}

        <Campo id="mensaje" etiqueta="Mensaje (opcional)">
          <textarea
            id="campo-mensaje"
            rows={3}
            maxLength={1000}
            value={campos.mensaje}
            onChange={(e) => actualizar("mensaje", e.currentTarget.value)}
            className={entrada(false) + " resize-y"}
          />
        </Campo>

        {/* Consentimiento — Ley 1581 de 2012, obligatorio */}
        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id="campo-consentimiento"
              type="checkbox"
              checked={campos.consentimiento}
              onChange={(e) => actualizar("consentimiento", e.currentTarget.checked)}
              onBlur={() => alSalir("consentimiento")}
              aria-invalid={Boolean(tocados.consentimiento && errores.consentimiento)}
              aria-describedby={errores.consentimiento ? "error-consentimiento" : undefined}
              className="mt-1 h-4 w-4 shrink-0 accent-dorado-400"
            />
            <span className="font-sans text-xs leading-relaxed text-crema/65">
              Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012
              para recibir información sobre este proyecto
              {hayPolitica ? (
                <>
                  , según la{" "}
                  <a
                    href={politicaUrl}
                    className="text-dorado-400 underline underline-offset-2 hover:text-dorado-500"
                  >
                    política de tratamiento de datos
                  </a>
                  .
                </>
              ) : (
                "."
              )}
            </span>
          </label>
          {tocados.consentimiento && errores.consentimiento && (
            <p id="error-consentimiento" role="alert" className="mt-2 font-sans text-xs text-dorado-400">
              {errores.consentimiento}
            </p>
          )}
        </div>

        {errores.general && (
          <p
            role="alert"
            className="rounded-sm border border-dorado-400/40 bg-verde-900/60 px-4 py-3 font-sans text-sm text-dorado-400"
          >
            {errores.general}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex w-full items-center justify-center rounded-sm bg-dorado-400 px-8 py-4 font-sans text-sm font-medium tracking-[0.14em] text-verde-900 uppercase transition-colors duration-200 hover:bg-dorado-500 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-dorado-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {enviando ? "Enviando…" : HAY_BACKEND ? "Quiero más información" : "Enviar por WhatsApp"}
        </button>
      </form>
    </div>
  );
}

/** Etiqueta legible de una banda, para el mensaje de WhatsApp. */
function etiquetaArea(id: string): string {
  return opcionesAreaInteres.find((o) => o.valor === id)?.etiqueta ?? "Sin definir";
}

/** Devuelve el id de banda que corresponde a un área en m². */
function bandaDeArea(area: number): string {
  if (area <= 5000) return "3500-5000";
  if (area <= 7500) return "5000-7500";
  return "7500-10000";
}

function entrada(hayError: boolean): string {
  return (
    "w-full rounded-sm border bg-verde-900 px-4 py-3 font-sans text-sm text-crema " +
    "placeholder:text-crema/30 focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-dorado-400 " +
    (hayError ? "border-dorado-400" : "border-dorado-500/30")
  );
}

function Campo({
  id,
  etiqueta,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={`campo-${id}`}
        className="mb-2 block font-sans text-[0.7rem] tracking-[0.16em] text-crema/60 uppercase"
      >
        {etiqueta}
      </label>
      {children}
      {error && (
        <p id={`error-${id}`} role="alert" className="mt-2 font-sans text-xs text-dorado-400">
          {error}
        </p>
      )}
    </div>
  );
}
