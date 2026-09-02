import type { APIRoute } from "astro";
import {
  enviarAlCrm,
  ipDe,
  pareceBot,
  respaldar,
  superaLimite,
  validar,
  type EntradaLead,
} from "../../lib/lead";

/**
 * POST /api/lead — único endpoint del sitio.
 *
 * Es la ÚNICA ruta que corre en servidor: todo lo demás se prerenderiza. Por
 * eso `prerender = false` va aquí y en ningún otro sitio.
 *
 * Orden deliberado de las comprobaciones:
 *   1. Bots  → se responde ok:true sin guardar nada. Devolver un error le
 *      enseñaría al bot qué cambiar; un éxito falso lo deja creyendo que ganó.
 *   2. Rate limit → 429 real, porque aquí sí hay una persona a la que informar.
 *   3. Validación → 400 con errores por campo.
 *   4. Respaldo en disco SIEMPRE, antes de hablar con el CRM.
 *   5. CRM en segundo plano respecto de la respuesta al visitante.
 */
export const prerender = false;

function json(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let entrada: EntradaLead;
  try {
    entrada = (await request.json()) as EntradaLead;
  } catch {
    return json({ ok: false, error: "cuerpo-invalido" }, 400);
  }

  // 1. Bots: éxito silencioso, sin guardar ni notificar
  if (pareceBot(entrada)) {
    return json({ ok: true });
  }

  const ip = ipDe(request, clientAddress ?? "");
  const userAgent = request.headers.get("user-agent") ?? "";

  // 2. Rate limit por IP
  if (await superaLimite(ip)) {
    return json(
      {
        ok: false,
        error: "limite",
        mensaje: "Recibimos varios envíos desde aquí. Escríbenos por WhatsApp y te atendemos.",
      },
      429,
    );
  }

  // 3. Validación en servidor (no se confía en el cliente)
  const resultado = validar(entrada, { ip, userAgent });
  if (!resultado.ok) {
    return json({ ok: false, error: "validacion", errores: resultado.errores }, 400);
  }

  const lead = resultado.lead;

  // 4. El CRM primero, para poder anotar en el respaldo cómo le fue.
  //    Aunque falle, el lead se guarda igual: el disco es la red de seguridad.
  const estadoCrm = await enviarAlCrm(lead);
  const respaldado = await respaldar(lead, estadoCrm);

  // 5. Si el CRM no está configurado o falló PERO el respaldo se escribió, el
  //    visitante ve éxito: el lead está a salvo y se recupera del .jsonl.
  //    Solo se le pide reintentar si se perdieron las dos vías a la vez.
  if (!respaldado && estadoCrm !== "enviado") {
    console.error(`[lead] LEAD PERDIDO ${lead.id}: sin CRM y sin respaldo en disco`);
    return json(
      {
        ok: false,
        error: "no-guardado",
        mensaje: "No pudimos registrar tus datos. Escríbenos por WhatsApp y te atendemos.",
      },
      500,
    );
  }

  return json({ ok: true, id: lead.id });
};

/** Cualquier otro método sobre esta ruta. */
export const ALL: APIRoute = () =>
  json({ ok: false, error: "metodo-no-permitido" }, 405);
