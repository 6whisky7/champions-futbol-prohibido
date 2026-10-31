export type LeagueTeam = {
  id: string;
  name: string;
  crest: string;
  dq: boolean;
};
export type LeagueMatch = {
  id: string;
  home: string;
  away: string;
  round: number;
  game_order: number;
  kind: string;
  hg: number;
  ag: number;
  scheduled_at: string | null;
  version: number;
};
export type LeagueRow = LeagueTeam & {
  position: number;
  pj: number;
  pg: number;
  pp: number;
  pn: number;
  gf: number;
  gc: number;
  dg: number;
  points: number;
  tie_pending?: boolean;
  tie_key?: string;
  tie_reason?: string;
  tie_opponent?: string;
  tie_mini_teams?: string[];
  tie_mini_wins?: number;
  administrative_gc: number;
};
export type League = {
  state?: "preview" | "active" | "closed";
  revision: number;
  seed: string;
  rounds: number;
  qualified: number;
  format: string;
  teams: LeagueTeam[];
  matches: LeagueMatch[];
  table: LeagueRow[];
  readiness?: {
    ready: boolean;
    reasons: string[];
    participants: number;
    qualified: number;
  };
  history?: {
    at: string;
    actor?: string | null;
    action: string;
    reason: string;
    before_value: unknown;
    after_value: unknown;
  }[];
};
export const matchLabels: Record<string, string> = {
  pending: "Pendiente",
  postponed: "Pospuesto",
  sport: "Terminado",
  null: "Nulo · doble ausencia",
  absence_home: "Ausencia local · 0–3",
  absence_away: "Ausencia visitante · 3–0",
  abandon_home: "Abandono local · 0–4",
  abandon_away: "Abandono visitante · 4–0",
  replay: "Repetir desde cero · caída general",
};
