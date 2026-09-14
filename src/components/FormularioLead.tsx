import { useEffect, useRef, useState } from "react";
import {
  lotesAgrupadosPorPredio,
  loteDeId,
  nombreLote,
  nombrePredio,
  precioM2,
} from "../data/lotes";
import { formatearCOP, formatearNumero, formatearValorM2, proyecto } from "../data/proyecto";

/**
 * ENTREGA DEL LEAD — webhook de n8n, no endpoint propio.
 *
 * El sitio es 100 % ESTÁTICO y sigue siéndolo: el adaptador de Node partía la
 * salida en dist/client + dist/server y tumbaba producción con un 403 (ver la
 * nota larga en astro.config.mjs). No se vuelve a `output: 'server'`.
 *
 * Así que el navegador hace POST directamente a un webhook de n8n, y n8n
 * reenvía al CRM. La URL lleva prefijo PUBLIC_ y por tanto VIAJA EN EL BUNDLE:
 * es pública por diseño. Consecuencias asumidas, porque el flujo no las
 * convierte en un problema:
 *   · Cualquiera puede mandar un POST a ese webhook. Es un buzón de leads, no
 *     una API con datos: lo peor que se consigue es basura en el CRM, y para eso
 *     están el honeypot, el tiempo mínimo y el filtrado en n8n.
 *   · Por lo mismo, NUNCA se pone un secreto ni una API key del CRM aquí. n8n es
 *     el que guarda las credenciales; el navegador solo conoce la URL del buzón.
 *
 * NUNCA PERDER UN LEAD: si el webhook no está configurado, falla, o el navegador
 * bloquea la petición por CORS, el formulario NO muestra un error y se rinde:
 * cae a WhatsApp con todos los datos ya escritos en el mensaje. Un lead que
 * llega por otro canal se atiende; uno que se perdió, no.
 */
const WEBHOOK = (import.meta.env.PUBLIC_N8N_WEBHOOK_URL ?? "").trim();

/* TODO: pegar aquí la URL de producción del webhook de n8n, definiendo
   PUBLIC_N8N_WEBHOOK_URL en hPanel (o en .env para probar en local). Mientras
   esté vacía o empiece por PENDIENTE, el formulario entrega por WhatsApp y no
   se pierde ningún lead. Al definirla, comprobar DOS cosas:
     1. Que el webhook de n8n acepta el origen https://lotescampestresguatape.com
        (Settings → CORS / allowedOrigins). Sin eso el navegador corta el POST y
        todo se va por el fallback sin que nadie se entere.
     2. Que el flujo de n8n responde 2xx rápido; el POST tiene 8 s de margen. */
const hayWebhook = WEBHOOK !== "" && !WEBHOOK.startsWith("PENDIENTE");

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Formulario de lead. Isla React con client:visible.
 *
 * Aquí React sí se gana su sitio: seis campos con validación por campo, estado
 * de envío, errores accesibles y dos orígenes de precarga (el plano y las cards
 * de lote por un lado, el simulador de pago por otro).
 *
 * El campo de lote es un SELECTOR DE LOTE REAL agrupado por predio. Antes era un
 * tramo de área genérico, que con precios reales ya no dice nada: lo que
 * califica un lead es qué lote concreto quiere, no qué tamaño le gustaría.
 */

interface Campos {
  nombre: string;
  whatsapp: string;
  email: string;
  /** id del lote ("vista-hermosa-01") o "" si aún no lo sabe */
  lote: string;
  mensaje: string;
  consentimiento: boolean;
}

type Errores = Partial<Record<keyof Campos | "general", string>>;

const VACIO: Campos = {
  nombre: "",
  whatsapp: "",
  email: "",
  lote: "",
  mensaje: "",
  consentimiento: false,
};

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

/** Normaliza el celular a 57XXXXXXXXXX antes de mandarlo al CRM. */
function normalizarWhatsApp(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  const nacional = digitos.startsWith("57") && digitos.length === 12 ? digitos.slice(2) : digitos;
  return nacional.length === 10 ? "57" + nacional : digitos;
}

/** Claves de atribución. Es parte del contrato con n8n: van SIEMPRE las 9. */
const CLAVES_ATRIBUCION = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "referrer",
  "landing_url",
] as const;

/**
 * Atribución guardada en el <head> (ver BaseLayout). Se devuelven las nueve
 * claves SIEMPRE, con "" donde no haya dato: una visita directa no trae utm_*,
 * y si se omitieran, n8n recibiría payloads con forma distinta según el origen
 * del visitante y el mapeo al CRM tendría que defenderse de campos ausentes.
 */
function leerAtribucion(): Record<string, string> {
  let guardado: Record<string, unknown> = {};
  try {
    guardado = JSON.parse(sessionStorage.getItem("vh:atribucion") || "{}");
  } catch {
    // Modo privado o almacenamiento bloqueado: se envía sin atribución, pero
    // con las claves presentes. Nunca debe impedir el envío del lead.
  }
  const salida: Record<string, string> = {};
  for (const clave of CLAVES_ATRIBUCION) {
    salida[clave] = typeof guardado[clave] === "string" ? (guardado[clave] as string) : "";
  }
  return salida;
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

  /** Cuota inicial que el visitante simuló en la calculadora, si pasó por ella */
  const [cuotaInicial, setCuotaInicial] = useState<number | null>(null);
  const [porcentajeCuota, setPorcentajeCuota] = useState<number | null>(null);

  /** Momento en que se pintó el formulario: por debajo de 3 s es un bot. */
  const ts = useRef(Date.now());
  const seccion = useRef<HTMLDivElement>(null);
  /** Honeypot: se lee su valor REAL al enviar. */
  const honeypot = useRef<HTMLInputElement>(null);

  const lote = campos.lote ? loteDeId(campos.lote) : undefined;

  /* Escucha lo que emiten el plano, las cards de lote y el simulador. Gracias a
     esto el lead llega al CRM con el lote y la cuota que definió el visitante. */
  useEffect(() => {
    function alLote(e: Event) {
      const d = (e as CustomEvent<{ loteId: string }>).detail;
      if (d?.loteId && loteDeId(d.loteId)) {
        setCampos((c) => ({ ...c, lote: d.loteId }));
      }
    }
    function alCotizar(e: Event) {
      const d = (e as CustomEvent<{ loteId: string; porcentaje: number; cuotaInicial: number }>)
        .detail;
      if (!d) return;
      if (d.loteId && loteDeId(d.loteId)) setCampos((c) => ({ ...c, lote: d.loteId }));
      if (typeof d.cuotaInicial === "number") setCuotaInicial(d.cuotaInicial);
      if (typeof d.porcentaje === "number") setPorcentajeCuota(d.porcentaje);
    }
    window.addEventListener("vh:lote-seleccionado", alLote);
    window.addEventListener("vh:cotizacion", alCotizar);
    return () => {
      window.removeEventListener("vh:lote-seleccionado", alLote);
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
    // Si cambia de lote a mano, la cuota simulada para el lote anterior deja de
    // tener sentido: mandarla al CRM junto al lote nuevo sería un dato falso.
    if (clave === "lote") {
      setCuotaInicial(null);
      setPorcentajeCuota(null);
    }
  }

  function alSalir(clave: keyof Campos) {
    setTocados((t) => ({ ...t, [clave]: true }));
    setErrores((e) => ({ ...e, [clave]: validarCampo(clave, campos[clave]) }));
  }

  /**
   * Payload que viaja a n8n y de ahí al CRM. Los nombres de campo son el
   * contrato con el flujo de n8n: cambiar uno aquí obliga a cambiarlo allí.
   */
  function payload(): Record<string, unknown> {
    return {
      origen: "landing-vista-hermosa",
      fecha_iso: new Date().toISOString(),

      nombre: campos.nombre.trim(),
      whatsapp: normalizarWhatsApp(campos.whatsapp),
      email: campos.email.trim().toLowerCase(),

      // Lote: siempre predio + número. El número solo es ambiguo, hay un "01"
      // en cada predio. `lote_id` es el identificador estable para el CRM.
      predio: lote ? nombrePredio(lote.predio) : "",
      lote: lote ? lote.etiqueta : "",
      lote_id: lote ? lote.id : "",
      precio_lote: lote ? lote.precio : null,
      area: lote ? lote.area : null,
      cuota_inicial_simulada: cuotaInicial,

      mensaje: campos.mensaje.trim(),
      consentimiento: campos.consentimiento,

      ...leerAtribucion(),
    };
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

    /* Antibots: honeypot relleno o menos de 3 s desde que se pintó el formulario.
       Se responde con un éxito falso; devolver un error le enseñaría al bot qué
       cambiar. Un humano no rellena seis campos en tres segundos. */
    const esBot =
      (honeypot.current?.value ?? "") !== "" || Date.now() - ts.current < 3000;
    if (esBot) {
      window.location.href = "/gracias";
      return;
    }

    if (!hayWebhook) {
      irAWhatsApp("sin-webhook");
      return;
    }

    setEnviando(true);
    setErrores({});

    /* Timeout propio: sin él, un n8n colgado dejaría al visitante esperando con
       el botón bloqueado hasta que el navegador se rinda. */
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), 8000);

    try {
      const respuesta = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
        signal: control.signal,
      });

      if (!respuesta.ok) throw new Error(`webhook ${respuesta.status}`);

      window.dataLayer.push({
        event: "lead_form_submit",
        canal: "n8n",
        lote: lote?.id ?? null,
        precio_lote: lote?.precio ?? null,
        cuota_inicial_simulada: cuotaInicial,
      });

      window.location.href = "/gracias";
    } catch (e) {
      /* El webhook falló, tardó demasiado o CORS lo cortó. NO se muestra un
         error: se entrega por WhatsApp con todo escrito. El lead no se pierde. */
      console.error("[lead] fallo el webhook, se entrega por WhatsApp:", e);
      setEnviando(false);
      irAWhatsApp("fallback-webhook");
    } finally {
      clearTimeout(temporizador);
    }
  }

  /**
   * Entrega por WhatsApp.
   *
   * OJO CON EL ORDEN: `window.open` va dentro del gesto del usuario. En el
   * camino de fallback ya hubo un `await` delante, así que Safari puede tratar
   * la pestaña nueva como emergente y bloquearla; por eso /gracias tiene su
   * propio botón de WhatsApp y el visitante nunca queda sin salida.
   */
  function irAWhatsApp(canal: string) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "lead_form_submit",
      canal,
      lote: lote?.id ?? null,
      precio_lote: lote?.precio ?? null,
      cuota_inicial_simulada: cuotaInicial,
    });
    window.open(enlaceConDatos(), "_blank", "noopener");
    window.location.href = "/gracias";
  }

  /** Mensaje de WhatsApp con los datos ya cualificados del visitante. */
  function enlaceConDatos(): string {
    const lineas = [
      "Hola, quiero informacion sobre los Lotes Campestres Vista Hermosa en Guatape.",
      "",
      `Nombre: ${campos.nombre}`,
      `Correo: ${campos.email}`,
      `Celular: ${campos.whatsapp}`,
    ];
    if (lote) {
      lineas.push(
        `Lote de interes: ${nombreLote(lote)}`,
        `Area: ${formatearNumero(lote.area)} m2`,
        `Precio: ${formatearCOP(lote.precio)}`,
      );
      if (cuotaInicial !== null) {
        const pct = porcentajeCuota !== null ? ` (${porcentajeCuota}%)` : "";
        lineas.push(`Cuota inicial simulada${pct}: ${formatearCOP(cuotaInicial)}`);
      }
    } else {
      lineas.push("Lote de interes: aun no lo he definido");
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

        {/* Selector de lote REAL, agrupado por predio. El <optgroup> no es
            decorativo: sin el predio delante, tres opciones se llamarían "01". */}
        <Campo id="lote" etiqueta="Lote de interés">
          <select
            id="campo-lote"
            value={campos.lote}
            onChange={(e) => actualizar("lote", e.currentTarget.value)}
            className={entrada(false)}
          >
            <option value="" className="bg-verde-900">
              Aún no lo he definido
            </option>
            {lotesAgrupadosPorPredio.map((grupo) => (
              <optgroup key={grupo.predio.id} label={grupo.predio.nombre}>
                {grupo.lotes
                  .filter((l) => l.estado === "disponible")
                  .map((l) => (
                    <option key={l.id} value={l.id} className="bg-verde-900">
                      {`Lote ${l.etiqueta} · ${formatearNumero(l.area)} m² · ${formatearCOP(l.precio)}`}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Campo>

        {/* Resumen de lo que el visitante configuró antes de llegar aquí. Se
            muestra para que vea que su selección viajó con él; estos valores son
            los que van al CRM. */}
        {lote && (
          <div className="rounded-sm border border-dorado-500/25 bg-verde-900/40 px-4 py-3">
            <p className="font-sans text-xs text-crema/70">
              <strong className="text-dorado-400">{nombreLote(lote)}</strong> ·{" "}
              {formatearNumero(lote.area)} m² · {formatearCOP(lote.precio)}
              <span className="block text-crema/45">
                {formatearValorM2(precioM2(lote))}
                {cuotaInicial !== null && (
                  <>
                    {" · cuota inicial"}
                    {porcentajeCuota !== null ? ` del ${porcentajeCuota} %` : ""}:{" "}
                    {formatearCOP(cuotaInicial)}
                  </>
                )}
              </span>
            </p>
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
          {enviando ? "Enviando…" : hayWebhook ? "Quiero más información" : "Enviar por WhatsApp"}
        </button>
      </form>
    </div>
  );
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
