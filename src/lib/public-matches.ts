import type { League, LeagueRow } from "@/lib/league/types";
import type { Knockout } from "@/lib/knockout";
export type PublicMatch = { id: string; phase: string; order: number; home: string | null; away: string | null; homeName: string; awayName: string; homeCrest: string | null; awayCrest: string | null; kind: string; hg: number | null; ag: number | null; scheduled_at: string | null; winner: string | null };
export const unresolved = (kind: string) => ["pending", "postponed", "replay", "blocked"].includes(kind);
export function publicMatches(l: League | null, k: Knockout | null): PublicMatch[] {
  const lm = l?.state && l.state !== "preview" ? l.matches.map(m => {
    const h = l.teams.find(t => t.id === m.home), a = l.teams.find(t => t.id === m.away);
    return { ...m, phase: `Liguilla · jornada ${m.round}`, order: m.round * 10000 + m.game_order, homeName: h?.name ?? "Por definir", awayName: a?.name ?? "Por definir", homeCrest: h?.crest ?? null, awayCrest: a?.crest ?? null, winner: !unresolved(m.kind) && m.hg !== m.ag ? (m.hg > m.ag ? m.home : m.away) : null };
  }) : [];
  const km = k && k.state !== "preview" ? k.matches.map(m => {
    const h = k.teams.find(t => t.id === m.home), a = k.teams.find(t => t.id === m.away);
    return { ...m, phase: m.round === 0 ? "Repesca" : `Eliminatorias · partido ${m.number}`, order: 1000000 + m.round * 10000 + m.number, homeName: h?.name ?? "Por definir", awayName: a?.name ?? "Por definir", homeCrest: h?.crest ?? null, awayCrest: a?.crest ?? null };
  }) : [];
  return [...lm, ...km].sort((a,b) => a.order-b.order);
}
export function nextPublicMatch(matches: PublicMatch[]) {
  return matches.filter(m => unresolved(m.kind) && m.home && m.away && m.scheduled_at && Number.isFinite(Date.parse(m.scheduled_at)))
    .sort((a,b) => Date.parse(a.scheduled_at!) - Date.parse(b.scheduled_at!) || a.order-b.order)[0] ?? null;
}
export function classificationZone(row: LeagueRow, l: Pick<League, "format" | "qualified" | "state">) {
  if (row.dq) return { key: "out", label: "Excluido" };
  if (row.tie_pending) return { key: "pending", label: "Zona por resolver" };
  const provisional = l.state !== "closed" ? " · provisional" : "";
  if (row.position > l.qualified) return { key: "out", label: "Eliminado" + provisional };
  if (l.format === "repechage" && row.position > 8) return { key: "repechage", label: "Repesca" + provisional };
  return { key: "direct", label: "Directo" + provisional };
}
export function sportingRecords(matches: PublicMatch[]) {
  // Administrative scores and the +100 GC sanction never enter sporting records.
  const sport = matches.filter(m => m.kind === "sport" && m.hg !== null && m.ag !== null);
  const best = (metric: (m: PublicMatch) => number) => {
    const max = Math.max(-1, ...sport.map(metric));
    return sport.filter(m => metric(m) === max);
  };
  return { count: sport.length, margin: best(m => Math.abs(m.hg! - m.ag!)), goals: best(m => m.hg! + m.ag!) };
}
