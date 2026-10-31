import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { eventColumns, type TournamentEvent } from "@/lib/events";
import type { League } from "@/lib/league/types";
import type { Knockout } from "@/lib/knockout";
import { publicMatches } from "@/lib/public-matches";

export type PublicTeam = { id: string; name: string; crest: string; number: string; captain: string; state: string; members: { roblox: string }[] };
export const publicCompetition = cache(async (id: string) => {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return null;
  const c = await createClient();
  // Explicit published filter also applies when a signed-in owner follows a public link.
  const { data: event, error } = await c.from("cfp_events").select(eventColumns).eq("id", id).eq("status", "published").maybeSingle();
  if (error) throw new Error("No se pudo consultar el evento.");
  if (!event) return null;
  const [l, k, t] = await Promise.all([
    c.rpc("cfp_league_read", { e: id, admin: false }),
    c.rpc("cfp_knockout_read", { e: id, admin: false }),
    c.rpc("cfp_public_teams", { e: id }),
  ]);
  if (l.error || k.error || t.error) throw new Error("No se pudo consultar la competición.");
  const league = l.data as League | null, knockout = k.data as Knockout | null;
  return { event: event as TournamentEvent, league, knockout, teams: (t.data ?? []) as PublicTeam[], matches: publicMatches(league, knockout) };
});

export async function publishedEvents() {
  const c = await createClient();
  const result: TournamentEvent[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await c.from("cfp_events").select(eventColumns).eq("status", "published").order("starts_at", { ascending: false }).order("id").range(offset, offset + 99);
    if (error) throw new Error("No se pudieron consultar las ediciones.");
    result.push(...(data ?? []) as TournamentEvent[]);
    if (!data || data.length < 100) return result;
  }
}
