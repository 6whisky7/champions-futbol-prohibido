import type { LeagueMatch } from "./league/types";
import { unresolved } from "./public-matches";
export function teamForm(matches: LeagueMatch[], id: string) {
  return matches
    .filter((m) => (m.home === id || m.away === id) && !unresolved(m.kind))
    .sort((a, b) => a.round - b.round || a.game_order - b.game_order)
    .slice(-5)
    .flatMap((m) => {
      if (m.kind === "null")
        return [
          { id: m.id, letter: "N", label: "Nulo administrativo", kind: m.kind },
        ];
      if (m.hg === m.ag) return [];
      const win =
        (m.home === id && m.hg > m.ag) || (m.away === id && m.ag > m.hg);
      return [
        {
          id: m.id,
          letter: win ? "V" : "D",
          label:
            (win ? "Victoria" : "Derrota") +
            (m.kind === "sport" ? " deportiva" : " administrativa"),
          kind: m.kind,
        },
      ];
    });
}
