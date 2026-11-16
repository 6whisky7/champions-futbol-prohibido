"use client";

import { Fragment, useState } from "react";
import type { League } from "@/lib/league/types";
import { classificationZone } from "@/lib/public-matches";
import { teamForm } from "@/lib/team-form";
import { tieExplanation } from "@/lib/league/tie-explanation";
import { TeamIdentity } from "./team-identity";
import { Progress } from "./ui/progress";

const statistics = [
  ["pg", "PG", "Ganados"], ["pp", "PP", "Perdidos"], ["pn", "PN", "Nulos"],
  ["gf", "GF", "Goles a favor"], ["gc", "GC", "Goles en contra"],
] as const;

export function AdminLeagueTable({ data, played }: { data: League; played: number }) {
  const [expanded, setExpanded] = useState(false);
  const total = data.matches.length;
  const qualifier = data.format === "repechage" ? "Top 8 a octavos · 9–24 a repesca"
    : "Top " + data.qualified + " pasan a " + (data.format === "quarters" ? "cuartos" : data.format === "round16" ? "octavos" : "dieciseisavos");

  return (
    <div className="admin-rankings">
      <header className="rank-header">
        <h2 id="league-table">Clasificación {data.state === "closed" ? "final" : "provisional"}</h2>
        <div className="rank-summary">
          <div className="rank-progress">
            <p>{played} de {total} partidos jugados</p>
            <Progress
              value={total ? played / total * 100 : 0}
              aria-label="Avance de la liguilla"
              aria-valuetext={played + " de " + total + " partidos"}
            />
          </div>
          <p className="rank-qualifier">{qualifier}</p>
        </div>
      </header>
      <div className="rank-tools">
        <button type="button" className="trophy-button" onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded} aria-controls="admin-ranking-rows">
          {expanded ? "Ocultar estadísticas" : "Ver más estadísticas"}
        </button>
      </div>
      <table className="rank-table" aria-labelledby="league-table">
        <thead>
          <tr>
            <th scope="col">Pos.</th>
            <th scope="col">Equipo</th>
            <th scope="col"><abbr title="Puntos">Pts</abbr></th>
            <th scope="col"><abbr title="Partidos jugados">PJ</abbr></th>
            <th scope="col"><abbr title="Diferencia de goles">DG</abbr></th>
            <th scope="col" className="rank-form">Racha</th>
          </tr>
        </thead>
        <tbody id="admin-ranking-rows">
          {data.table.map((row, index) => {
            const zone = classificationZone(row, data);
            const form = teamForm(data.matches, row.id);
            const previous = data.table[index - 1]?.position ?? row.position;
            const cutoff = (previous <= data.qualified && row.position > data.qualified) ||
              (data.format === "repechage" && previous <= 8 && row.position > 8);
            const streak = form.length ? (
              <span className="rank-streak" aria-label="Últimos cinco partidos por jornada">
                {form.map((game) => (
                  <span key={game.id} data-result={game.letter} title={game.label}>
                    <span aria-hidden="true">{game.letter}</span><span className="sr-only">{game.label}</span>
                  </span>
                ))}
              </span>
            ) : <span className="rank-unplayed">Sin jugar</span>;

            return (
              <Fragment key={row.id}>
                <tr className="rank-team-row" data-cut={cutoff || undefined}>
                  <td><span className="rank-position" data-leader={row.position === 1 && !row.tie_pending && !row.dq || undefined}>
                    {row.tie_pending && <span aria-label="Empatado">=</span>}{row.position}
                  </span></td>
                  <th scope="row">
                    <TeamIdentity name={row.name} crest={row.crest} />
                    {(row.dq || (row.tie_pending && row.pj > 0)) && <small className="rank-team-status">{row.dq ? "Descalificado" : "Empate pendiente"}</small>}
                  </th>
                  <td><strong className="rank-points">{row.points ?? "—"}</strong></td>
                  <td>{row.pj ?? "—"}</td>
                  <td className="rank-difference" data-direction={row.dg > 0 ? "up" : row.dg < 0 ? "down" : undefined}>
                    {row.dg > 0 ? "+" : ""}{row.dg ?? "—"}
                  </td>
                  <td className="rank-form">{streak}</td>
                </tr>
                {expanded && <tr className="rank-detail-row">
                  <td colSpan={6}>
                    <div aria-label={"Estadísticas de " + row.name}>
                      <dl className="rank-detail-stats">
                        {statistics.map(([key, short, label]) => (
                          <div key={key}><dt><abbr title={label}>{short}</abbr></dt><dd>{row[key] ?? "—"}</dd></div>
                        ))}
                      </dl>
                      <div className="rank-detail-form"><span>Racha</span>{streak}</div>
                      <p>{zone.label}{(row.tie_reason || row.tie_pending || row.dq) && " · " + tieExplanation(row, data.teams)}</p>
                    </div>
                  </td>
                </tr>}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
