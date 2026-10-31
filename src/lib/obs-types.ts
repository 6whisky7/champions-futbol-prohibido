import type { LeagueRow } from "@/lib/league/types";
import type { KnockoutMatch, KnockoutTeam } from "@/lib/knockout";
import type { LiveMatch } from "@/lib/live";
export type ObsView = "marcador" | "clasificacion" | "cuadro";
export type ObsDocument = {
  event: { id: string; name: string };
  now: string;
  view: ObsView;
  match?: LiveMatch | null;
  table?: LeagueRow[];
  leagueState?: string;
  format?: string;
  qualified?: number;
  page?: number;
  total?: number;
  knockout?: {
    state: string;
    teams: Pick<KnockoutTeam, "id" | "name" | "crest" | "seed" | "dq">[];
    matches: KnockoutMatch[];
  } | null;
  round?: number | null;
};
