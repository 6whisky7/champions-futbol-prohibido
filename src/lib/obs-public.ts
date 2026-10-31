import "server-only";
import { createClient } from "@/lib/supabase/server";
import { publicCompetition } from "@/lib/public-competition";
import { unresolved } from "@/lib/public-matches";
import type { PublicLive } from "@/lib/live";
import type { ObsDocument, ObsView } from "@/lib/obs-types";
export async function publicObs(
  id: string,
  view: string,
  query: URLSearchParams,
): Promise<ObsDocument | null> {
  if (
    !/^[a-f0-9-]{36}$/i.test(id) ||
    !["marcador", "clasificacion", "cuadro"].includes(view)
  )
    return null;
  if (view === "marcador") {
    const c = await createClient(),
      { data, error } = await c.rpc("cfp_live_public", { e: id });
    if (error) throw Error("No se pudo consultar el marcador público.");
    if (!data) return null;
    const live = data as PublicLive,
      wanted = query.get("partido"),
      match = wanted
        ? live.matches.find((m) => m.id === wanted)
        : (live.matches.find(
            (m) => m.active && m.home && m.away && unresolved(m.kind),
          ) ?? live.matches[0]);
    if (wanted && !match) return null;
    return {
      event: live.event,
      now: live.now,
      view: "marcador",
      match: match ?? null,
    };
  }
  const d = await publicCompetition(id);
  if (!d) return null;
  const base = {
    event: { id: d.event.id, name: d.event.name },
    now: new Date().toISOString(),
    view: view as ObsView,
  };
  if (view === "clasificacion") {
    const rows = d.league?.table ?? [],
      page = Math.max(
        1,
        Math.min(
          Math.ceil(rows.length / 12) || 1,
          Number.parseInt(query.get("pagina") ?? "1", 10) || 1,
        ),
      );
    return {
      ...base,
      table: rows.slice((page - 1) * 12, page * 12),
      leagueState: d.league?.state,
      format: d.league?.format,
      qualified: d.league?.qualified,
      page,
      total: rows.length,
    };
  }
  const k = d.knockout,
    requested = query.has("ronda") ? Number(query.get("ronda")) : null,
    round =
      requested !== null && k?.matches.some((m) => m.round === requested)
        ? requested
        : null;
  return {
    ...base,
    knockout: k
      ? {
          state: k.state,
          teams: k.teams.map(({ id, name, crest, seed, dq }) => ({
            id,
            name,
            crest,
            seed,
            dq,
          })),
          matches: k.matches,
        }
      : null,
    round,
  };
}
