import type { ApplicationPayload } from "./applications";

export type ApplicationIssue = { field: string; label: string; message: string };
export type ApplicationReceipt = { id: string; state: string; expires_at: string | null };
export type ApplicationResponse = { error?: string; issues?: ApplicationIssue[]; uncertain?: boolean; result?: ApplicationReceipt };
export type UsernameKind = "roblox" | "tiktok";

// Mirrors the existing database comparison only. Never write this value into the payload.
export function canonicalHandle(value: string) {
  return value.trim().toLowerCase().replace(/^@|\s/g, "");
}

export function usernameError(value: string, kind: UsernameKind, strictSpaces = true): string | undefined {
  const platform = kind === "roblox" ? "Roblox" : "TikTok";
  if (!value.trim()) return `Escribe el usuario real de ${platform}.`;
  if (/https?:|[/:]/i.test(value)) return `Escribe solo el usuario de ${platform}, no el enlace del perfil.`;
  if (strictSpaces && /\s/.test(value.trim())) return `El usuario de ${platform} no lleva espacios. Cópialo desde tu perfil.`;
  const canonical = canonicalHandle(value);
  const allowed = kind === "roblox" ? /^[a-z0-9_]+$/ : /^[a-z0-9_.]+$/;
  if (!allowed.test(canonical)) return `El usuario de ${platform} contiene caracteres no permitidos. Usa tu usuario real, sin emojis ni adornos.`;
  const min = kind === "roblox" ? 3 : 2;
  const max = kind === "roblox" ? 20 : 24;
  if (canonical.length < min || canonical.length > max) return `El usuario de ${platform} debe tener entre ${min} y ${max} caracteres, sin contar @.`;
}

// Only remove accidental ASCII spaces; never transliterate, remove emoji or invent an identity.
export function usernameSuggestion(value: string, kind: UsernameKind) {
  if (!usernameError(value, kind) || !/ /.test(value.trim())) return null;
  const candidate = value.replace(/ /g, "");
  return !usernameError(candidate, kind) ? candidate : null;
}

export function validateApplication(value: unknown, options: {
  strictSpaces?: boolean;
  reserved?: string[];
  waiting?: boolean;
  confirmations?: { requirements: boolean; privacy: boolean };
} = {}): ApplicationIssue[] {
  const issues: ApplicationIssue[] = [];
  const add = (field: string, label: string, message: string) => issues.push({ field, label, message });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    add("team-name", "Equipo", "Revisa los datos del equipo."); return issues;
  }
  const p = value as Partial<ApplicationPayload>;
  const normalName = typeof p.name === "string" ? p.name.toLowerCase().replace(/[áéíóúüñ]/g, c => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n" })[c]!).replace(/[^a-z0-9]/g, "") : "";
  if (typeof p.name !== "string" || [...p.name].length < 3 || [...p.name].length > 60 || normalName.length < 3)
    add("team-name", "Nombre del equipo", "Escribe un nombre de equipo de 3 a 60 caracteres.");
  if (typeof p.crest !== "string" || !/^(0[1-9]|[1-3][0-9]|4[0-8])$/.test(p.crest))
    add("crest", "Escudo", "Elige uno de los 48 escudos.");
  else if (!options.waiting && options.reserved?.includes(p.crest))
    add("crest", "Escudo", "Este escudo está reservado. Elige otro o solicita lista de espera, sin reservas.");
  if (typeof p.captain !== "string" || !/^[0-2]$/.test(p.captain))
    add("captain", "Capitán", "Elige como capitán a uno de los tres titulares.");
  if (p.number !== undefined && p.number !== "" && (typeof p.number !== "string" || !/^(0[1-9]|[1-9][0-9])$/.test(p.number)))
    add("team-name", "Número anterior del equipo", "El número opcional anterior debe ir del 01 al 99. Consulta al organizador para corregirlo.");
  if (!Array.isArray(p.members) || ![3, 4].includes(p.members.length)) {
    add("roblox-0", "Plantilla", "Añade tres titulares y, si quieres, un suplente.");
  } else {
    const seen: Record<UsernameKind, Map<string, number>> = { roblox: new Map(), tiktok: new Map() };
    p.members.forEach((member, i) => {
      const role = i === 3 ? "Suplente" : `Titular ${i + 1}`;
      for (const kind of ["roblox", "tiktok"] as const) {
        const raw = member?.[kind];
        const error = typeof raw === "string" ? usernameError(raw, kind, options.strictSpaces ?? true) : "Escribe el nombre de usuario.";
        if (error) add(`${kind}-${i}`, `${role}: ${kind === "roblox" ? "Roblox" : "TikTok"}`, error);
        else {
          const canonical = canonicalHandle(raw);
          const previous = seen[kind].get(canonical);
          if (previous !== undefined) add(`${kind}-${i}`, `${role}: ${kind}`, `Este usuario ya figura en ${previous === 3 ? "el suplente" : "el titular " + (previous + 1)}. Cada integrante debe tener su propia cuenta.`);
          else seen[kind].set(canonical, i);
        }
      }
      if (member?.number !== undefined && (typeof member.number !== "string" || (member.number !== "" && !/^(0[1-9]|[1-9][0-9])$/.test(member.number))))
        add(`player-number-${i}`, `${role}: número`, "Deja el número vacío o escribe dos cifras del 01 al 99.");
    });
  }
  if (options.confirmations && !options.confirmations.requirements)
    add("requirements-confirmation", "Confirmación de plantilla", "Confirma que has revisado la plantilla y los requisitos antes de continuar.");
  if (options.confirmations && !options.confirmations.privacy)
    add("privacy-confirmation", "Aviso de privacidad", "Lee y acepta el aviso de privacidad antes de continuar.");
  return issues;
}

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function validReceipt(value: unknown): value is ApplicationReceipt {
  if (!value || typeof value !== "object") return false;
  const r = value as ApplicationReceipt;
  return typeof r.id === "string" && uuid.test(r.id) &&
    ["pending", "waiting", "approved", "expired", "rejected"].includes(r.state) &&
    (r.expires_at === null || (typeof r.expires_at === "string" && /^\d{4}-\d{2}-\d{2}T/.test(r.expires_at) && Number.isFinite(Date.parse(r.expires_at)))) &&
    (r.state !== "pending" || r.expires_at !== null);
}

const knownErrors: Record<string, string> = {
  "Nombre inválido (3–60 caracteres).": "Revisa el nombre del equipo: debe tener entre 3 y 60 caracteres.",
  "Elige un escudo válido.": "Elige uno de los 48 escudos.",
  "Número opcional del 01 al 99.": "El número opcional debe ir del 01 al 99.",
  "El número del jugador debe ir del 01 al 99.": "Revisa los números de los jugadores: vacíos o del 01 al 99.",
  "Plantilla inválida.": "Revisa los datos de los tres titulares y del suplente, si lo añadiste.",
  "Tres titulares, un capitán y un suplente opcional.": "Completa tres titulares y elige un capitán. El suplente es opcional.",
  "Revisa los usuarios de Roblox y TikTok.": "Revisa los usuarios reales de Roblox y TikTok, sin enlaces, emojis ni adornos.",
  "Hay un usuario repetido en la plantilla.": "Un usuario aparece más de una vez en tu plantilla. Revisa las cuentas indicadas.",
  "Escudo o nombre reservado. Elige otro sin perder tu plantilla.": "El nombre del equipo o el escudo ya está reservado. Revisa ambos; conservamos tu plantilla.",
  "Un integrante ya tiene una reserva activa en este evento.": "Uno de los usuarios indicados ya tiene una reserva activa en este evento. Consulta al organizador; conservamos tus datos.",
  "No quedan plazas. Puedes enviar a lista de espera.": "El cupo acaba de completarse. Puedes elegir la lista de espera, sin reservas, y revisar de nuevo.",
  "Las inscripciones están cerradas.": "Las inscripciones se han cerrado. Conservamos tus datos en esta página; consulta al organizador.",
  "Espera un minuto antes de enviar otra solicitud.": "Espera un minuto antes de volver a intentarlo desde esta página.",
  "Referencia de reintento inválida.": "No se pudo comprobar este envío con seguridad. Conserva esta página y consulta al organizador antes de enviar otra solicitud.",
  "El aviso de privacidad no está confirmado o cambió. Conservamos tus datos; consulta al organizador.": "El aviso de privacidad cambió o no está habilitado. Conserva esta página y consulta al organizador.",
  "Has realizado varios envíos desde esta conexión. Espera antes de reintentar; conservamos tus datos.": "Has realizado varios envíos desde esta conexión. Espera antes de reintentar; conservamos tus datos.",
};

export const uncertainMessage = "No podemos confirmar si la solicitud se guardó. Conservamos tus datos. No envíes otra desde otra página: comprueba este mismo envío o consulta a @whiskyzc.";
export function applicationResponse(data: unknown): ApplicationResponse {
  if (!data || typeof data !== "object") return { error: uncertainMessage, uncertain: true };
  const r = data as { error?: unknown; result?: unknown };
  if (typeof r.error === "string") {
    // Only known business failures are safe to expose; never echo SQL or private values.
    const message = Object.hasOwn(knownErrors, r.error) ? knownErrors[r.error] : undefined;
    return message ? { error: message, ...(r.error === "Referencia de reintento inválida." ? { uncertain: true } : {}) } : { error: uncertainMessage, uncertain: true };
  }
  return validReceipt(r.result) ? { result: r.result } : { error: uncertainMessage, uncertain: true };
}
