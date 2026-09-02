import { useEffect, useMemo, useRef, useState } from "react";
import { CALCULADORA, opcionesValorM2 } from "../data/lotes";
import { formatearCOP, formatearNumero } from "../data/proyecto";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/**
 * Calculadora de inversión. La única isla React de esta sección.
 *
 * Es la mejor herramienta de calificación que tiene la página: el lead llega al
 * CRM con área y presupuesto ya definidos por él mismo. Por eso aquí sí compensa
 * el runtime de React —hay estado real, sincronización entre tres controles y un
 * resultado derivado—, y se monta con client:visible para no entrar en la carga
 * inicial.
 *
 * Sin dependencias: useState y useMemo. El cálculo es una multiplicación; lo que
 * cuesta es mantener coherentes slider, input numérico y selector de valor.
 */

const PRESET_POR_DEFECTO = opcionesValorM2.find((o) => o.porDefecto)!.valor;

/** Acota un número al rango, tolerando NaN. */
function acotar(valor: number, min: number, max: number): number {
  if (!Number.isFinite(valor)) return min;
  return Math.min(max, Math.max(min, valor));
}

/** Redondea al paso del slider para que ambos controles no se desincronicen. */
function alPaso(valor: number): number {
  return Math.round(valor / CALCULADORA.areaPaso) * CALCULADORA.areaPaso;
}

export default function Calculadora() {
  const [area, setArea] = useState(CALCULADORA.areaPorDefecto);
  const [valorM2, setValorM2] = useState<number>(PRESET_POR_DEFECTO);
  /** Texto crudo del input de valor propio: se guarda como string para no
   *  pelear con el cursor mientras el usuario escribe. */
  const [valorPropio, setValorPropio] = useState("");
  const [loteInteres, setLoteInteres] = useState<string | null>(null);

  const total = useMemo(() => area * valorM2, [area, valorM2]);
  const totalAnimado = useNumeroAnimado(total);

  /* El plano y las bandas de área preseleccionan valores aquí */
  useEffect(() => {
    function alSeleccionarLote(e: Event) {
      const detalle = (e as CustomEvent<{ lote: string }>).detail;
      if (detalle?.lote) setLoteInteres(detalle.lote);
    }
    function alPreseleccionarArea(e: Event) {
      const detalle = (e as CustomEvent<{ area: number }>).detail;
      if (typeof detalle?.area === "number") {
        setArea(acotar(alPaso(detalle.area), CALCULADORA.areaMin, CALCULADORA.areaMax));
      }
    }
    window.addEventListener("vh:lote-seleccionado", alSeleccionarLote);
    window.addEventListener("vh:area-preseleccionada", alPreseleccionarArea);
    return () => {
      window.removeEventListener("vh:lote-seleccionado", alSeleccionarLote);
      window.removeEventListener("vh:area-preseleccionada", alPreseleccionarArea);
    };
  }, []);

  /* `calculadora_usada` se dispara cuando el usuario deja de mover los
     controles, no en cada píxel del slider: si no, un solo arrastre generaría
     cientos de eventos y el dato dejaría de servir para nada. */
  const primeraCarga = useRef(true);
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    const id = setTimeout(() => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "calculadora_usada", area, valor_m2: valorM2 });
    }, 900);
    return () => clearTimeout(id);
  }, [area, valorM2]);

  function elegirPreset(valor: number) {
    setValorM2(valor);
    setValorPropio("");
  }

  function escribirValorPropio(texto: string) {
    // Se aceptan solo dígitos: los separadores de miles los pone el formateador
    const limpio = texto.replace(/\D/g, "");
    setValorPropio(limpio);
    if (limpio !== "") {
      setValorM2(acotar(Number(limpio), CALCULADORA.valorM2Min, CALCULADORA.valorM2Max));
    }
  }

  function cotizar() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "cotizar_click",
      area,
      valor_m2: valorM2,
      inversion_estimada: total,
      lote: loteInteres,
    });

    /* El formulario (Etapa 6) escucha esto para precargar sus campos ocultos */
    window.dispatchEvent(
      new CustomEvent("vh:cotizacion", {
        detail: { area, valorM2, total, lote: loteInteres },
      }),
    );

    const destino = document.getElementById("contacto");
    if (destino) destino.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const esPreset = opcionesValorM2.some((o) => o.valor === valorM2) && valorPropio === "";

  return (
    <div
      id="calculadora"
      className="mt-16 overflow-hidden rounded-sm border border-dorado-500/25 bg-verde-800"
    >
      <div className="grid lg:grid-cols-5">
        {/* ── Controles ────────────────────────────────────────────── */}
        <div className="p-5 sm:p-10 lg:col-span-3">
          <p className="font-sans text-[0.7rem] tracking-[0.2em] text-dorado-400/80 uppercase">
            Calcula tu inversión
          </p>

          {loteInteres && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-xs border border-dorado-400/40 px-2.5 py-1 font-sans text-[0.65rem] tracking-[0.14em] text-dorado-400 uppercase">
              Lote {loteInteres} seleccionado
            </p>
          )}

          {/* Área */}
          <div className="mt-9">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label
                htmlFor="area-slider"
                className="font-sans text-sm text-crema/70"
              >
                Área del lote
              </label>
              <div className="flex items-baseline gap-2">
                <input
                  id="area-numero"
                  type="number"
                  inputMode="numeric"
                  min={CALCULADORA.areaMin}
                  max={CALCULADORA.areaMax}
                  step={CALCULADORA.areaPaso}
                  value={area}
                  onChange={(e) => setArea(Number(e.currentTarget.value))}
                  onBlur={(e) =>
                    setArea(
                      acotar(
                        alPaso(Number(e.currentTarget.value)),
                        CALCULADORA.areaMin,
                        CALCULADORA.areaMax,
                      ),
                    )
                  }
                  aria-label="Área en metros cuadrados"
                  className="w-28 rounded-sm border border-dorado-500/40 bg-verde-900 px-3 py-2 text-right font-serif text-xl text-dorado-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dorado-400"
                />
                <span className="font-serif text-xl text-dorado-400">m²</span>
              </div>
            </div>

            <input
              id="area-slider"
              type="range"
              min={CALCULADORA.areaMin}
              max={CALCULADORA.areaMax}
              step={CALCULADORA.areaPaso}
              value={area}
              onChange={(e) => setArea(Number(e.currentTarget.value))}
              aria-label="Área del lote en metros cuadrados"
              className="mt-5 w-full"
            />

            <div className="mt-2 flex justify-between font-sans text-[0.65rem] tracking-[0.1em] text-crema/40">
              <span>{formatearNumero(CALCULADORA.areaMin)} m²</span>
              <span>{formatearNumero(CALCULADORA.areaMax)} m²</span>
            </div>
          </div>

          {/* Valor por m² */}
          <fieldset className="mt-10">
            <legend className="font-sans text-sm text-crema/70">Valor por m²</legend>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {opcionesValorM2.map((opcion) => {
                const activo = esPreset && valorM2 === opcion.valor;
                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => elegirPreset(opcion.valor)}
                    aria-pressed={activo}
                    className={
                      "rounded-sm border px-4 py-2.5 font-sans text-xs transition-colors duration-200 " +
                      (activo
                        ? "border-dorado-400 bg-dorado-400/15 text-dorado-400"
                        : "border-dorado-500/35 text-crema/70 hover:border-dorado-500 hover:text-crema")
                    }
                  >
                    {opcion.etiqueta}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <label htmlFor="valor-propio" className="font-sans text-xs text-crema/50">
                O escribe otro valor
              </label>
              <input
                id="valor-propio"
                type="text"
                inputMode="numeric"
                placeholder={String(CALCULADORA.valorM2Min)}
                value={valorPropio}
                onChange={(e) => escribirValorPropio(e.currentTarget.value)}
                className="w-32 rounded-sm border border-dorado-500/40 bg-verde-900 px-3 py-2 font-sans text-sm text-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dorado-400"
              />
            </div>
            <p className="mt-2 font-sans text-[0.65rem] text-crema/40">
              Entre {formatearCOP(CALCULADORA.valorM2Min)} y {formatearCOP(CALCULADORA.valorM2Max)} por m².
            </p>
          </fieldset>
        </div>

        {/* ── Resultado ────────────────────────────────────────────── */}
        <div className="flex flex-col justify-center gap-6 border-t border-dorado-500/20 bg-verde-900 p-5 sm:p-10 lg:col-span-2 lg:border-t-0 lg:border-l">
          <p className="font-sans text-xs text-crema/55">
            {formatearNumero(area)} m² × {formatearCOP(valorM2)}/m²
          </p>

          <p
            className="font-serif text-[2rem] leading-none break-all text-dorado-400 sm:text-5xl"
            aria-live="polite"
          >
            {formatearCOP(totalAnimado)}
          </p>

          <p className="font-sans text-xs leading-relaxed text-crema/45">{CALCULADORA.nota}</p>

          <button
            type="button"
            onClick={cotizar}
            className="mt-2 inline-flex items-center justify-center rounded-sm bg-dorado-400 px-8 py-4 font-sans text-sm font-medium tracking-[0.14em] text-verde-900 uppercase transition-colors duration-200 hover:bg-dorado-500 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-dorado-400"
          >
            Cotizar este lote
          </button>
        </div>
      </div>
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
