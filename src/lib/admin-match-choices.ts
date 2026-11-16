import type { League } from "./league/types";
import { matchLabels } from "./league/types";
import { knockoutLabels, knockoutRoundName, type Knockout } from "./knockout";
import { publicMatches, unresolved, type PublicMatch } from "./public-matches";

export type MatchChoice = PublicMatch & {
  round: number;
  group: string;
  stage: "league" | "knockout";
  decision?: string;
  inProgress?: boolean;
};

export function leagueMatchChoices(league: League): MatchChoice[] {
  if (!league.state || league.state === "preview") return [];
  const rounds = new Map(league.matches.map((match) => [match.id, match.round]));
  return publicMatches(league, null).map((match) => {
    const round = rounds.get(match.id)!;
    return {
      ...match, round, group: "Liguilla · Jornada " + round, stage: "league",
      decision: match.kind !== "pending" && match.kind !== "sport" ? matchLabels[match.kind] : undefined,
    };
  });
}

export function knockoutMatchChoices(knockout: Knockout | null): MatchChoice[] {
  if (!knockout || knockout.state === "preview") return [];
  const rounds = new Map(knockout.matches.map((match) => [match.id, match.round]));
  const last = Math.max(...rounds.values());
  return publicMatches(null, knockout).map((match) => {
    const round = rounds.get(match.id)!;
    return {
      ...match, round, group: "Eliminatorias · " + knockoutRoundName(round, last), stage: "knockout",
      decision: match.kind !== "pending" && match.kind !== "sport" ? knockoutLabels[match.kind] : undefined,
    };
  });
}

export function matchChoiceStatus(match: MatchChoice) {
  if (!unresolved(match.kind)) return "finished";
  return match.inProgress ? "live" : "pending";
}
