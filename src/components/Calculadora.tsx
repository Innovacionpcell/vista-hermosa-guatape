import { useEffect, useMemo, useRef, useState } from "react";
import {
  CALCULADORA,
  CUOTA_INICIAL_POR_DEFECTO,
  PORCENTAJES_CUOTA_INICIAL,
  lotesAgrupadosPorPredio,
  loteDeId,
  nombreLote,
  precioM2,
  simularPago,
} from "../data/lotes";
import { formatearCOP, formatearNumero, formatearValorM2 } from "../data/proyecto";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Simulador de pago sobre un LOTE REAL.
 *
 * Aquí había un slider genérico de área × valor por m². Ya no: con precios
 * reales en la mano, ese control dejaba al visitante componer un lote que no
 * existe y producía leads con un presupuesto que no correspondía a ninguna
 * parcela del inventario. Ahora se elige un lote de verdad y todo lo demás se
 * deriva de él: área, precio, $/m², cuota inicial y saldo.
 *
 * Sigue siendo la mejor herramienta de calificación de la página: el lead llega
 * al CRM con un lote concreto y una cuota inicial que él mismo simuló. Por eso
 * compensa el runtime de React, y por eso se monta con client:visible y no entra
 * en la carga inicial.
 *
 * El selector por defecto arranca VACÍO, no con un lote preseleccionado: una
 * cifra ya pintada al llegar se lee como "el precio del proyecto" en vez de como
 * "el precio de este lote".
 */

export default function Calculadora() {
  const [loteId, setLoteId] = useState<string>("");
  const [porcentaje, setPorcentaje] = useState<number>(CUOTA_INICIAL_POR_DEFECTO);

  const lote = useMemo(() => (loteId ? loteDeId(loteId) : undefined), [loteId]);
  const pago = useMemo(
    () => (lote ? simularPago(lote, porcentaje) : null),
    [lote, porcentaje],
  );
  const cuotaAnimada = useNumeroAnimado(pago?.cuotaInicial ?? 0);

  /* El plano y las cards de lote preseleccionan aquí */
  useEffect(() => {
    function alSeleccionarLote(e: Event) {
      const detalle = (e as CustomEvent<{ loteId: string }>).detail;
      if (detalle?.loteId && loteDeId(detalle.loteId)) setLoteId(detalle.loteId);
    }
    window.addEventListener("vh:lote-seleccionado", alSeleccionarLote);
    return () => window.removeEventListener("vh:lote-seleccionado", alSeleccionarLote);
  }, []);

  /* `calculadora_usada` se dispara cuando el usuario deja de cambiar cosas, no
     en cada pulsación: si no, el dato deja de servir para nada. */
  const primeraCarga = useRef(true);
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    if (!lote) return;
    const id = setTimeout(() => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "calculadora_usada",
        lote: lote.id,
        precio_lote: lote.precio,
        cuota_inicial_pct: porcentaje,
      });
    }, 900);
    return () => clearTimeout(id);
  }, [lote, porcentaje]);

  function cotizar() {
    if (!lote || !pago) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cotizar_click",
      lote: lote.id,
      predio: lote.predio,
      precio_lote: lote.precio,
      area: lote.area,
      cuota_inicial_simulada: pago.cuotaInicial,
    });

    /* El formulario escucha esto y precarga predio, lote, precio y cuota */
    window.dispatchEvent(
      new CustomEvent("vh:cotizacion", {
        detail: {
          loteId: lote.id,
          porcentaje,
          cuotaInicial: pago.cuotaInicial,
          saldo: pago.saldo,
        },
      }),
    );

    const destino = document.getElementById("contacto");
    if (destino) destino.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      id="calculadora"
      className="mt-16 overflow-hidden rounded-sm border border-dorado-500/25 bg-verde-800"
    >
      <div className="grid lg:grid-cols-5">
        {/* ── Controles ────────────────────────────────────────────── */}
        <div className="p-5 sm:p-10 lg:col-span-3">
          <p className="font-sans text-[0.7rem] tracking-[0.2em] text-dorado-400/80 uppercase">
            Simula tu pago
          </p>

          {/* Selector de lote real. Un <optgroup> por predio, porque el número
              solo es ambiguo: hay un "01" en cada predio. */}
          <div className="mt-9">
            <label htmlFor="selector-lote" className="font-sans text-sm text-crema/70">
              Elige el lote
            </label>
            <select
              id="selector-lote"
              value={loteId}
              onChange={(e) => setLoteId(e.currentTarget.value)}
              className="mt-4 w-full rounded-sm border border-dorado-500/40 bg-verde-900 px-4 py-3.5 font-sans text-sm text-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dorado-400"
            >
              <option value="" className="bg-verde-900">
                Selecciona un lote…
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
          </div>

          {/* Ficha del lote elegido */}
          {lote ? (
            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-dorado-500/20 pt-8 sm:grid-cols-3">
              <Dato etiqueta="Predio y lote" valor={nombreLote(lote)} />
              <Dato etiqueta="Área licencia" valor={`${formatearNumero(lote.area)} m²`} />
              <Dato etiqueta="Precio total" valor={formatearCOP(lote.precio)} destacado />
              <Dato etiqueta="Valor por m²" valor={formatearValorM2(precioM2(lote))} />
            </dl>
          ) : (
            <p className="mt-9 border-t border-dorado-500/20 pt-8 font-sans text-sm leading-relaxed text-crema/50">
              Elige un lote y te mostramos su área, su precio total, su valor por m² y
              cuánto sería la cuota inicial.
            </p>
          )}

          {/* Cuota inicial */}
          <fieldset className="mt-10" disabled={!lote}>
            <legend className="font-sans text-sm text-crema/70">Cuota inicial</legend>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {PORCENTAJES_CUOTA_INICIAL.map((pct) => {
                const activo = porcentaje === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPorcentaje(pct)}
                    aria-pressed={activo}
                    className={
                      "rounded-sm border px-5 py-2.5 font-sans text-xs transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 " +
                      (activo
                        ? "border-dorado-400 bg-dorado-400/15 text-dorado-400"
                        : "border-dorado-500/35 text-crema/70 hover:border-dorado-500 hover:text-crema")
                    }
                  >
                    {pct} %
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* ── Resultado ────────────────────────────────────────────── */}
        <div className="flex flex-col justify-center gap-5 border-t border-dorado-500/20 bg-verde-900 p-5 sm:p-10 lg:col-span-2 lg:border-t-0 lg:border-l">
          <p className="font-sans text-xs text-crema/55">
            {lote
              ? `${nombreLote(lote)} · cuota inicial del ${porcentaje} %`
              : "Cuota inicial estimada"}
          </p>

          <p
            className="font-serif text-[2rem] leading-none break-words text-dorado-400 sm:text-5xl"
            aria-live="polite"
          >
            {lote ? formatearCOP(cuotaAnimada) : "—"}
          </p>

          {lote && pago && (
            <p className="font-sans text-sm text-crema/60">
              Saldo: <span className="text-crema/85">{formatearCOP(pago.saldo)}</span>
              <span className="block text-xs text-crema/40">
                sobre un precio total de {formatearCOP(lote.precio)}
              </span>
            </p>
          )}

          <p className="font-sans text-xs leading-relaxed text-crema/45">{CALCULADORA.nota}</p>

          <button
            type="button"
            onClick={cotizar}
            disabled={!lote}
            className="mt-2 inline-flex items-center justify-center rounded-sm bg-dorado-400 px-8 py-4 font-sans text-sm font-medium tracking-[0.14em] text-verde-900 uppercase transition-colors duration-200 hover:bg-dorado-500 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-dorado-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {lote ? `Cotizar lote ${lote.etiqueta}` : "Elige un lote"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dato({
  etiqueta,
  valor,
  destacado = false,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div>
      <dt className="font-sans text-[0.65rem] tracking-[0.16em] text-crema/45 uppercase">
        {etiqueta}
      </dt>
      <dd
        className={
          "mt-1.5 font-serif break-words " +
          (destacado ? "text-xl text-dorado-400 sm:text-2xl" : "text-lg text-crema/90")
        }
      >
        {valor}
      </dd>
    </div>
  );
}

/**
 * Cuenta hasta el valor nuevo en ~450 ms. Respeta prefers-reduced-motion, donde
 * salta directo: una cifra que baila es justo lo que ese ajuste pide evitar.
 */
function useNumeroAnimado(objetivo: number): number {
  const [valor, setValor] = useState(objetivo);
  const desde = useRef(objetivo);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reducido =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducido) {
      desde.current = objetivo;
      setValor(objetivo);
      return;
    }

    const inicio = performance.now();
    const origen = desde.current;
    const delta = objetivo - origen;
    const duracion = 450;

    function paso(ahora: number) {
      const t = Math.min(1, (ahora - inicio) / duracion);
      // easeOutCubic: arranca rápido y frena, que es como se lee bien una cifra
      const e = 1 - Math.pow(1 - t, 3);
      setValor(Math.round(origen + delta * e));
      if (t < 1) {
        raf.current = requestAnimationFrame(paso);
      } else {
        desde.current = objetivo;
      }
    }

    raf.current = requestAnimationFrame(paso);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      desde.current = objetivo;
    };
  }, [objetivo]);

  return valor;
}
