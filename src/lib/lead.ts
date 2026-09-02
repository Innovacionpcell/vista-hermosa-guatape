/**
 * Lógica de servidor del formulario de leads.
 *
 * SOLO SE IMPORTA DESDE EL ENDPOINT. Nada de aquí puede acabar en el bundle del
 * navegador: lee variables de entorno sin prefijo PUBLIC_ (que Astro no expone
 * al cliente) y toca el sistema de archivos.
 *
 * Principio rector: NUNCA PERDER UN LEAD. Si el webhook del CRM no está
 * configurado, falla, o tarda de más, el lead se escribe igualmente en un
 * .jsonl fuera del directorio servido y el visitante ve un éxito. Un lead en un
 * archivo se recupera; un lead que nunca se guardó, no.
 */

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHmac, randomUUID, createHash } from "node:crypto";
import path from "node:path";

// ── Configuración de entorno ────────────────────────────────────────────────
// Sin prefijo PUBLIC_: se leen en servidor y no viajan al navegador.
// Se leen en cada petición y no al importar el módulo, para que definir la
// variable en el panel de Hostinger surta efecto sin volver a compilar.

function env(clave: string): string {
  return process.env[clave] ?? "";
}

/** Carpeta de datos, fuera de dist/client: nada de aquí se sirve por HTTP. */
function directorioDatos(): string {
  return env("LEADS_DATA_DIR") || path.join(process.cwd(), ".data");
}

const ARCHIVO_LEADS = "leads.jsonl";
const ARCHIVO_LIMITE = "rate-limit.json";

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface EntradaLead {
  nombre?: unknown;
  whatsapp?: unknown;
  email?: unknown;
  area_interes?: unknown;
  lote_interes?: unknown;
  valor_m2_estimado?: unknown;
  inversion_estimada?: unknown;
  mensaje?: unknown;
  consentimiento?: unknown;
  /** Honeypot: si viene relleno, es un bot */
  website?: unknown;
  /** Momento en que se pintó el formulario, en ms */
  ts?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  gclid?: unknown;
  fbclid?: unknown;
  referrer?: unknown;
  landing_url?: unknown;
}

export interface LeadNormalizado {
  origen: string;
  fecha_iso: string;
  id: string;
  nombre: string;
  whatsapp: string;
  email: string;
  area_interes: string;
  lote_interes: string;
  valor_m2_estimado: number | null;
  inversion_estimada: number | null;
  mensaje: string;
  consentimiento: boolean;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  gclid: string;
  fbclid: string;
  referrer: string;
  landing_url: string;
  ip: string;
  user_agent: string;
}

export type Errores = Record<string, string>;

// ── Validación ──────────────────────────────────────────────────────────────

const AREAS_VALIDAS = new Set(["3500-5000", "5000-7500", "7500-10000", "sin-definir"]);

function texto(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

/**
 * Normaliza un móvil colombiano a formato internacional 57XXXXXXXXXX.
 * Acepta "3105145648", "+57 310 514 5648", "57-310-514-5648".
 * Los móviles en Colombia son 10 dígitos y empiezan por 3.
 */
export function normalizarWhatsApp(valor: unknown): string | null {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  const nacional = digitos.startsWith("57") && digitos.length === 12 ? digitos.slice(2) : digitos;
  if (nacional.length !== 10 || !nacional.startsWith("3")) return null;
  return "57" + nacional;
}

/** Validación de correo deliberadamente laxa: descarta erratas obvias sin
 *  rechazar direcciones válidas raras. El filtro de verdad es que responda. */
function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valor);
}

function numeroOpcional(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/**
 * Valida y normaliza. NO se confía en la validación del cliente: cualquiera
 * puede enviar un POST a este endpoint sin pasar por el formulario.
 */
export function validar(
  entrada: EntradaLead,
  contexto: { ip: string; userAgent: string },
): { ok: true; lead: LeadNormalizado } | { ok: false; errores: Errores } {
  const errores: Errores = {};

  const nombre = texto(entrada.nombre, 80);
  if (nombre.length < 2) errores.nombre = "Escribe tu nombre completo.";

  const whatsapp = normalizarWhatsApp(entrada.whatsapp);
  if (!whatsapp) errores.whatsapp = "Escribe un número de celular colombiano de 10 dígitos.";

  const email = texto(entrada.email, 120).toLowerCase();
  if (!emailValido(email)) errores.email = "Escribe un correo válido.";

  if (entrada.consentimiento !== true) {
    errores.consentimiento = "Necesitamos tu autorización para contactarte.";
  }

  const area = texto(entrada.area_interes, 20);
  const area_interes = AREAS_VALIDAS.has(area) ? area : "sin-definir";

  if (Object.keys(errores).length > 0) return { ok: false, errores };

  return {
    ok: true,
    lead: {
      origen: "landing-vista-hermosa",
      fecha_iso: new Date().toISOString(),
      id: randomUUID(),
      nombre,
      whatsapp: whatsapp!,
      email,
      area_interes,
      lote_interes: texto(entrada.lote_interes, 10),
      valor_m2_estimado: numeroOpcional(entrada.valor_m2_estimado),
      inversion_estimada: numeroOpcional(entrada.inversion_estimada),
      mensaje: texto(entrada.mensaje, 1000),
      consentimiento: true,
      utm_source: texto(entrada.utm_source, 100),
      utm_medium: texto(entrada.utm_medium, 100),
      utm_campaign: texto(entrada.utm_campaign, 150),
      utm_content: texto(entrada.utm_content, 150),
      utm_term: texto(entrada.utm_term, 150),
      gclid: texto(entrada.gclid, 200),
      fbclid: texto(entrada.fbclid, 200),
      referrer: texto(entrada.referrer, 300),
      landing_url: texto(entrada.landing_url, 300),
      ip: contexto.ip,
      user_agent: contexto.userAgent,
    },
  };
}

// ── Antibots ────────────────────────────────────────────────────────────────

/**
 * Honeypot + tiempo mínimo. Un humano no rellena y envía en menos de 3 s, y
 * el campo `website` está oculto: solo un bot que rellena todo lo toca.
 */
export function pareceBot(entrada: EntradaLead): boolean {
  if (texto(entrada.website, 100) !== "") return true;
  const ts = Number(entrada.ts);
  if (!Number.isFinite(ts) || ts <= 0) return true;
  return Date.now() - ts < 3000;
}

// ── Rate limit ──────────────────────────────────────────────────────────────

const LIMITE_ENVIOS = 5;
const VENTANA_MS = 60 * 60 * 1000; // 1 hora

/** La IP se guarda hasheada: para contar envíos no hace falta conservarla. */
function huella(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function superaLimite(ip: string): Promise<boolean> {
  const dir = directorioDatos();
  const archivo = path.join(dir, ARCHIVO_LIMITE);
  const clave = huella(ip);
  const ahora = Date.now();

  let registro: Record<string, number[]> = {};
  try {
    registro = JSON.parse(await readFile(archivo, "utf8"));
  } catch {
    // Primera vez o archivo ilegible: se empieza de cero
  }

  const previos = (registro[clave] ?? []).filter((t) => ahora - t < VENTANA_MS);

  if (previos.length >= LIMITE_ENVIOS) return true;

  previos.push(ahora);
  registro[clave] = previos;

  // Poda: sin esto el archivo crece sin fin con IPs que ya no cuentan
  for (const k of Object.keys(registro)) {
    registro[k] = registro[k]!.filter((t) => ahora - t < VENTANA_MS);
    if (registro[k]!.length === 0) delete registro[k];
  }

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(archivo, JSON.stringify(registro), "utf8");
  } catch (e) {
    // Si no se puede escribir, NO se bloquea el envío: es preferible aceptar
    // un lead de más que perder uno bueno por un fallo de disco.
    console.error("[lead] no se pudo escribir el rate limit:", e);
  }

  return false;
}

// ── Respaldo en disco ───────────────────────────────────────────────────────

/**
 * Escribe el lead como una línea JSON. Se llama SIEMPRE, haya o no webhook:
 * el archivo es la fuente de verdad de respaldo, no un plan B parcial.
 */
export async function respaldar(
  lead: LeadNormalizado,
  estadoCrm: string,
): Promise<boolean> {
  const dir = directorioDatos();
  try {
    await mkdir(dir, { recursive: true });
    await appendFile(
      path.join(dir, ARCHIVO_LEADS),
      JSON.stringify({ ...lead, crm: estadoCrm }) + "\n",
      "utf8",
    );
    return true;
  } catch (e) {
    console.error("[lead] FALLO AL RESPALDAR EN DISCO:", e);
    return false;
  }
}

// ── Envío al CRM ────────────────────────────────────────────────────────────

export type EstadoCrm = "enviado" | "sin-configurar" | "error" | "timeout";

/**
 * Reenvía al webhook del CRM, firmado con HMAC-SHA256 en la cabecera
 * X-Signature para que el receptor pueda verificar que el payload es nuestro.
 *
 * Si CRM_WEBHOOK_URL no está definida todavía, devuelve "sin-configurar" sin
 * tratarlo como error: es el estado normal mientras el CRM no exista. El lead
 * ya quedó respaldado en disco y se recupera del .jsonl cuando haya webhook.
 */
export async function enviarAlCrm(lead: LeadNormalizado): Promise<EstadoCrm> {
  const url = env("CRM_WEBHOOK_URL");
  const secreto = env("CRM_WEBHOOK_SECRET");

  if (!url || url.startsWith("PENDIENTE")) return "sin-configurar";

  const cuerpo = JSON.stringify(lead);
  const cabeceras: Record<string, string> = { "Content-Type": "application/json" };
  if (secreto) {
    cabeceras["X-Signature"] = createHmac("sha256", secreto).update(cuerpo).digest("hex");
  }

  // Timeout propio: sin él, un CRM colgado dejaría al visitante esperando
  // con el botón bloqueado hasta que el navegador se rinda.
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 8000);

  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: cabeceras,
      body: cuerpo,
      signal: control.signal,
    });
    if (!respuesta.ok) {
      console.error(`[lead] el CRM respondió ${respuesta.status} para ${lead.id}`);
      return "error";
    }
    return "enviado";
  } catch (e) {
    const abortado = e instanceof Error && e.name === "AbortError";
    console.error(`[lead] fallo al enviar ${lead.id} al CRM:`, e);
    return abortado ? "timeout" : "error";
  } finally {
    clearTimeout(temporizador);
  }
}

// ── IP del visitante ────────────────────────────────────────────────────────

/**
 * Hostinger sirve detrás de su CDN, así que la IP real llega en cabeceras de
 * proxy. Se toma la primera de X-Forwarded-For, que es la del cliente.
 */
export function ipDe(request: Request, respaldo: string): string {
  const cabeceras = request.headers;
  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0]!.trim();
  return cabeceras.get("cf-connecting-ip") || cabeceras.get("x-real-ip") || respaldo || "";
}
