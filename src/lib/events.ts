export const eventFormats = {
  quarters: { label: "Cuartos", minimum: 8, opponents: 4, qualified: 8 },
  round16: { label: "Octavos", minimum: 16, opponents: 6, qualified: 16 },
  round32: { label: "Dieciseisavos clásicos", minimum: 32, opponents: 8, qualified: 32 },
  repechage: { label: "Champions con repesca", minimum: 24, opponents: 8, qualified: 24 },
} as const;
export type EventFormat = keyof typeof eventFormats;
export interface TournamentEvent {
  id: string; name: string; description: string; starts_at: string; ends_at: string | null;
  capacity: number; format: EventFormat; eliminate_after_league: boolean;
  status: "draft" | "published"; registration_status: "closed" | "open"; review_hours: number; updated_at: string;
}
export const eventColumns = "id,name,description,starts_at,ends_at,capacity,format,eliminate_after_league,status,registration_status,review_hours,updated_at";
export function eventDate(date: string) {
  return new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "long", timeStyle: "short" }).format(new Date(date));
}
export function localDate(date?: string | null) {
  return date ? new Date(new Date(date).getTime() - 6 * 3600000).toISOString().slice(0, 16) : "";
}
export function parseEvent(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const format = text("format") as EventFormat;
  if (!Object.hasOwn(eventFormats, format)) throw new Error("Elige un formato válido.");
  const name = text("name"), description = text("description");
  if (name.length < 3 || name.length > 100 || description.length > 5000) throw new Error("Revisa el nombre (3–100 caracteres) y la descripción (hasta 5000).");
  const capacity = Number(text("capacity"));
  if (!Number.isSafeInteger(capacity) || capacity % 2 || capacity < eventFormats[format].minimum || capacity > 2147483647) throw new Error(`El cupo debe ser par y de al menos ${eventFormats[format].minimum} equipos.`);
  const eliminate = text("eliminate_after_league") === "yes";
  if (!eliminate && capacity !== eventFormats[format].qualified) throw new Error(`Sin eliminación en liguilla deben continuar todos: ${eventFormats[format].qualified} equipos.`);
  function date(key: string, required: boolean) {
    const raw = text(key);
    if (!raw && !required) return null;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) throw new Error("Revisa las fechas, en hora de Costa Rica.");
    const value = new Date(`${raw}:00-06:00`);
    if (!Number.isFinite(value.getTime()) || localDate(value.toISOString()) !== raw) throw new Error("La fecha no es válida.");
    return value.toISOString();
  }
  const starts_at = date("starts_at", true)!, ends_at = date("ends_at", false);
  if (ends_at && ends_at < starts_at) throw new Error("El final debe ser posterior al inicio.");
  const status = text("status");
  if (!["draft", "published"].includes(status)) throw new Error("Estado de publicación inválido.");
  const registration_status=text("registration_status")||"closed";
  if (!["closed","open"].includes(registration_status) || (registration_status==="open" && status!=="published")) throw new Error("Solo un evento publicado puede abrir inscripciones.");
  const review_hours=Number(text("review_hours")||48);
  if (!Number.isInteger(review_hours)||review_hours<1||review_hours>720) throw new Error("Plazo de revisión: entre 1 y 720 horas.");
  return { name, description, capacity, format, eliminate_after_league: eliminate, starts_at, ends_at, status, registration_status, review_hours };
}
