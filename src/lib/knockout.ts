export type KnockoutTeam = {
  id: string;
  seed: number;
  name: string;
  crest: string;
  dq: boolean;
  members: { roblox: string; role: string; captain: boolean }[];
};
export type KnockoutMatch = {
  id: string;
  number: number;
  round: number;
  slot: number;
  home_seed: number | null;
  away_seed: number | null;
  home_source: string | null;
  away_source: string | null;
  home: string | null;
  away: string | null;
  winner: string | null;
  loser: string | null;
  kind: string;
  hg: number | null;
  ag: number | null;
  attempt: number;
  scheduled_at: string | null;
};
export type Champion = {
  team: KnockoutTeam;
  runner_up: KnockoutTeam | null;
  final: KnockoutMatch;
  event_name: string;
  closed_at: string;
};
export type Knockout = {
  state: "preview" | "active" | "finished";
  format: string;
  revision: number;
  teams: KnockoutTeam[];
  matches: KnockoutMatch[];
  champion: Champion | null;
  history?: {
    at: string;
    actor: string;
    action: string;
    reason: string;
    before_value: unknown;
    after_value: unknown;
  }[];
};
export const knockoutLabels: Record<string, string> = {
  pending: "Pendiente",
  postponed: "Pospuesto",
  sport: "Resultado deportivo",
  absence_home: "Ausencia local · 0–3",
  absence_away: "Ausencia visitante · 3–0",
  abandon_home: "Abandono local · 0–4",
  abandon_away: "Abandono visitante · 4–0",
  replay: "Repetir desde cero · caída general",
  classification: "Pase por clasificación de liguilla",
  bye: "Pase administrativo sin jugar",
  void: "Sin ganador habilitado",
  blocked: "Pendiente de decisión administrativa",
};
export function knockoutDate(value: string) {
  return (
    new Date(new Date(value).getTime() - 6 * 3600000)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ") + " · Costa Rica"
  );
}
