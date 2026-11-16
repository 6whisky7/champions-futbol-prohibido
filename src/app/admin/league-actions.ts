"use server";
import { matchLabels, type League, type LeagueMatch } from "@/lib/league/types";
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


export async function saveLeagueMatch(
  eventId: string,
  match: {
    id: string;
    kind: string;
    hg: number;
    ag: number;
    scheduled_at: string | null;
    reason: string;
  },
  revision: number,
  version: number,
): Promise<{ ok: true; match: LeagueMatch; revision: number } | { ok: false; message: string }> {
  const client = await requireOwner();
  const fail = (message: string) => ({ ok: false as const, message });
  if (
    ![eventId, match.id].every((id) => /^[a-f0-9-]{36}$/i.test(id)) ||
    !Object.hasOwn(matchLabels, match.kind) ||
    ![revision, version, match.hg, match.ag].every((n) => Number.isSafeInteger(n) && n >= 0) ||
    (match.scheduled_at !== null && !Number.isFinite(Date.parse(match.scheduled_at)))
  ) return fail("Revisa el partido, el estado y el marcador.");

  const result = await client.rpc("cfp_league_action", {
    e: eventId, action: "match", p: match, expected: revision,
  });
  if (result.error) return fail(result.error.message);
  revalidatePath("/admin", "layout");
  revalidatePath("/eventos", "layout");

  const read = await client.rpc("cfp_league_read", { e: eventId, admin: true });
  const league = read.data as League | null;
  const saved = league?.matches?.find((row) => row.id === match.id);
  const expectedHome = match.kind === "sport" ? match.hg : match.kind === "absence_away" ? 3 : match.kind === "abandon_away" ? 4 : 0;
  const expectedAway = match.kind === "sport" ? match.ag : match.kind === "absence_home" ? 3 : match.kind === "abandon_home" ? 4 : 0;
  if (
    read.error || !league || !saved || saved.version !== version + 1 || saved.kind !== match.kind ||
    saved.hg !== expectedHome || saved.ag !== expectedAway ||
    (saved.scheduled_at ? Date.parse(saved.scheduled_at) : null) !== (match.scheduled_at ? Date.parse(match.scheduled_at) : null)
  )
    return fail("No se pudo confirmar el resultado. Actualiza el calendario y revisa el partido antes de volver a guardar.");
  return { ok: true, match: saved, revision: league.revision };
}
