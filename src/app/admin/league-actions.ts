"use server";
import { matchLabels, type League, type LeagueMatch } from "@/lib/league/types";
import { localDate } from "@/lib/events";
import { unresolved } from "@/lib/public-matches";
import { requireOwner } from "@/lib/owner";
import { revalidatePath } from "next/cache";
export async function leagueAction(
  eventId: string,
  action: string,
  p: Record<string, unknown>,
  revision: number,
) {
  const c = await requireOwner();
  if (["preview", "regenerate", "confirm"].includes(action)) {
    const { data, error } = await c.rpc("cfp_league_read", {
      e: eventId,
      admin: true,
    });
    if (error || !data?.readiness?.ready)
      return (
        data?.readiness?.reasons?.join(" ") ??
        "No se pudo comprobar la preparación del evento."
      );
  }
  const result =
    action === "preview"
      ? await c.rpc("cfp_league_preview", { e: eventId })
      : await c.rpc("cfp_league_action", {
          e: eventId,
          action,
          p,
          expected: revision,
        });
  if (result.error) return result.error.message;
  revalidatePath("/admin", "layout");
  revalidatePath("/eventos", "layout");
  return "Guardado.";
}


type MatchEdit =
  | { mode: "score"; home: number; away: number; reason: string }
  | { mode: "decision"; kind: string; reason: string }
  | { mode: "schedule"; date: string };

export async function saveLeagueMatch(
  eventId: string,
  matchId: string,
  revision: number,
  version: number,
  edit: MatchEdit,
): Promise<{ ok: true; league: League; match: LeagueMatch } | { ok: false; message: string }> {
  const client = await requireOwner();
  const fail = (message: string) => ({ ok: false as const, message });
  const stale = "El partido cambió mientras lo editabas. Revisa el marcador guardado antes de volver a intentarlo.";
  if (
    ![eventId, matchId].every((id) => /^[a-f0-9-]{36}$/i.test(id)) ||
    ![revision, version].every((n) => Number.isSafeInteger(n) && n >= 0)
  ) return fail("Vuelve a abrir el partido desde el calendario.");

  const read = async () => {
    const { data, error } = await client.rpc("cfp_league_read", { e: eventId, admin: true });
    return error ? null : (data as League | null);
  };
  const current = await read();
  if (!current || current.state !== "active") return fail("No se pudo abrir este partido de la liguilla.");
  const match = current.matches.find((row) => row.id === matchId);
  if (!match || match.version !== version || current.revision !== revision) return fail(stale);

  let { kind, hg, ag, scheduled_at } = match;
  let reason: string;
  switch (edit.mode) {
    case "score":
      kind = "sport";
      hg = edit.home;
      ag = edit.away;
      if (![hg, ag].every((n) => Number.isInteger(n) && n >= 0 && n <= 2147483647))
        return fail("Introduce los goles de ambos equipos.");
      if (hg === ag || Math.abs(hg - ag) > 4)
        return fail("Debe haber un ganador. La diferencia máxima es de cuatro goles.");
      reason = unresolved(match.kind) ? "Registro deportivo de un partido pendiente." : edit.reason.trim();
      break;
    case "decision":
      if (!Object.hasOwn(matchLabels, edit.kind) || edit.kind === "sport")
        return fail("Selecciona una decisión para el partido.");
      kind = edit.kind;
      hg = kind === "absence_away" ? 3 : kind === "abandon_away" ? 4 : 0;
      ag = kind === "absence_home" ? 3 : kind === "abandon_home" ? 4 : 0;
      reason = edit.reason.trim();
      break;
    case "schedule": {
      const date = new Date(edit.date + ":00-06:00");
      if (edit.date && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(edit.date) || !Number.isFinite(date.getTime()) || localDate(date.toISOString()) !== edit.date))
        return fail("Revisa la fecha y la hora del partido.");
      scheduled_at = edit.date ? date.toISOString() : null;
      reason = scheduled_at ? "Horario del partido programado o actualizado." : "Horario del partido retirado.";
      break;
    }
    default:
      return fail("Selecciona una acción para el partido.");
  }
  if (reason.length < 3 || reason.length > 1000) return fail("Escribe un motivo de 3 a 1000 caracteres.");

  const result = await client.rpc("cfp_league_action", {
    e: eventId,
    action: "match",
    p: { id: matchId, kind, hg, ag, scheduled_at, reason },
    expected: revision,
  });
  if (result.error) {
    const latest = await read();
    return fail(latest && latest.revision !== revision ? stale : result.error.message);
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/eventos", "layout");

  const league = await read();
  const saved = league?.matches.find((row) => row.id === matchId);
  if (
    !league || !saved || saved.version !== version + 1 || saved.kind !== kind ||
    saved.hg !== hg || saved.ag !== ag ||
    (saved.scheduled_at ? Date.parse(saved.scheduled_at) : null) !== (scheduled_at ? Date.parse(scheduled_at) : null)
  ) return fail("No se pudo confirmar el guardado. Revisa el partido en el calendario antes de volver a guardar.");
  return { ok: true, league, match: saved };
}
