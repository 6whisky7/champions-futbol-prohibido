import {
  knockoutRoundName,
  type Champion,
  type Knockout,
  type KnockoutTeam,
} from "@/lib/knockout";

function roundLabel(round: number, finalRound: number) {
  const label = knockoutRoundName(round, finalRound);
  return label === "Semifinales" ? "Semifinal" : label;
}

export function knockoutImagePhase(knockout: Knockout, matchId: string) {
  const match = knockout.matches.find(({ id }) => id === matchId);
  if (!match) return null;
  if (match.round === 0) return "Repesca";
  const finalRound = Math.max(...knockout.matches.map(({ round }) => round));
  return "Eliminatorias · " + roundLabel(match.round, finalRound);
}

type DefeatedRival = { phase: string; team: KnockoutTeam };

export function defeatedRivals(knockout: Knockout, champion: Champion) {
  const matches = new Map(knockout.matches.map((match) => [match.id, match]));
  const teams = new Map(knockout.teams.map((team) => [team.id, team]));
  const winner = champion.team.id;
  const rivals: DefeatedRival[] = [];
  let match = champion.final;

  // Follow the champion's own feeder chain. An unverified link invalidates the route.
  while (match.winner === winner) {
    const atHome = match.home === winner;
    if (!atHome && match.away !== winner) return [];
    const source = atHome ? match.home_source : match.away_source;
    const seed = atHome ? match.home_seed : match.away_seed;
    if (!source) return seed === champion.team.seed ? rivals.reverse() : [];

    const previous = matches.get(source);
    if (!previous || previous.round >= match.round || previous.winner !== winner) return [];
    if (previous.kind === "sport") {
      const opponentId = previous.home === winner ? previous.away : previous.home;
      const opponent = opponentId ? teams.get(opponentId) : undefined;
      if (!opponent || opponent.id === winner || previous.loser !== opponent.id) return [];
      rivals.push({
        phase: roundLabel(previous.round, champion.final.round),
        team: opponent,
      });
    }
    match = previous;
  }
  return [];
}

export function championScore({ final, team }: Champion) {
  if (final.hg === null || final.ag === null) return null;
  if (final.home === team.id) return [final.hg, final.ag] as const;
  if (final.away === team.id) return [final.ag, final.hg] as const;
  return null;
}
