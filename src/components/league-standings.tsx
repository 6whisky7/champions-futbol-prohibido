"use client";
import { Scale, LockKeyhole } from "lucide-react";
import type { League } from "@/lib/league/types";
import { classificationZone, unresolved } from "@/lib/public-matches";
import { teamForm } from "@/lib/team-form";
import { tieExplanation } from "@/lib/league/tie-explanation";
import { TeamIdentity } from "./team-identity";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ConfirmAction } from "./confirm-action";
export function LeagueStandings({
  data,
  eventId,
  admin,
  busy,
  message,
  onAction,
}: {
  data: League;
  eventId: string;
  admin: boolean;
  busy: boolean;
  message: string;
  onAction: (action: string, p?: Record<string, unknown>) => Promise<boolean>;
}) {
  const remaining = data.matches.filter((m) => unresolved(m.kind)).length,
    lots = [
      ...new Set(
        data.table.filter((r) => r.tie_pending).map((r) => r.tie_key!),
      ),
    ],
    names = (id: string) =>
      data.teams.find((t) => t.id === id)?.name ?? "Equipo";
  const passing =
    data.format === "repechage"
      ? "Los 8 primeros pasan a octavos; del 9 al 24 juegan repesca."
      : `Los ${data.qualified} primeros habilitados pasan a ${data.format === "quarters" ? "cuartos" : data.format === "round16" ? "octavos" : "dieciseisavos"}.`;
  return (
    <section className="admin-surface standings-surface">
      {admin && data.state === "active" && (
        <section className="closure-review" id="league-close" tabIndex={-1}>
          <h2>Revisión de cierre</h2>
          <p>
            <strong>
              {data.matches.length - remaining}/{data.matches.length} partidos
              resueltos
            </strong>{" "}
            · {lots.length} desempates pendientes.
          </p>
          <p id="league-close-block">
            {remaining
              ? `Faltan ${remaining} partidos por resolver.`
              : lots.length
                ? "Resuelve los sorteos pendientes antes de fijar la tabla."
                : "Puedes revisar y fijar la clasificación final."}{" "}
            El cierre conserva puestos y participantes; no crea eliminatorias
            automáticamente.
          </p>
          {lots.map((key) => (
            <Button
              key={key}
              variant="outline"
              disabled={busy || remaining > 0}
              onClick={() =>
                void onAction("lot", {
                  key,
                  reason: "Sorteo explícito de puestos empatados",
                })
              }
            >
              Sortear:{" "}
              {data.table
                .filter((r) => r.tie_key === key)
                .map((r) => r.name)
                .join(", ")}
            </Button>
          ))}
          <ConfirmAction
            label="Cerrar liguilla y conservar clasificación"
            title="Fijar la clasificación final"
            description="Los puestos y la clasificación de referencia quedarán conservados. No podrás cambiar los resultados de la liguilla desde estas pantallas después del cierre. El cuadro se prepara y confirma aparte; no se añaden equipos de espera."
            busy={busy}
            message={message}
            disabled={remaining > 0 || lots.length > 0}
            onConfirm={() => onAction("close")}
          />
        </section>
      )}
      <div className="standings-heading">
        <h2 id="league-table">
          Clasificación {data.state === "closed" ? "final" : "provisional"}
        </h2>
        <p>{passing}</p>
        {data.state !== "closed" && (
          <p className="admin-note">
            Zonas provisionales. Un empate pendiente mantiene la zona por
            resolver.
          </p>
        )}
      </div>
      <div
        className="league-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Tabla de clasificación"
      >
        <table className="league-table polished-table">
          <thead>
            <tr>
              {[
                "Pos.",
                "Equipo",
                "Puntos",
                "DG",
                "Racha",
                "PJ",
                "PG",
                "PP",
                "PN",
                "GF",
                "GC",
              ].map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.table.map((r, i) => {
              const zone = classificationZone(r, data),
                form = teamForm(data.matches, r.id),
                cut =
                  i > 0 &&
                  ((r.position > data.qualified &&
                    data.table[i - 1].position <= data.qualified) ||
                    (data.format === "repechage" &&
                      r.position > 8 &&
                      data.table[i - 1].position <= 8));
              return (
                <tr
                  key={r.id}
                  data-zone={zone.key}
                  className={cut ? "qualification-cut" : ""}
                >
                  <td className="position-cell">
                    {r.tie_pending ? "=" : ""}
                    {r.position}
                  </td>
                  <th scope="row" className="sticky-team">
                    <TeamIdentity
                      name={r.name}
                      crest={r.crest}
                      href={
                        !admin
                          ? `/eventos/${eventId}/equipos/${r.id}`
                          : undefined
                      }
                    />
                    <span className={"zone-label zone-" + zone.key}>
                      {zone.label}
                    </span>
                    <details className="tie-explanation">
                      <summary>
                        <Badge variant="outline">
                          <Scale aria-hidden="true" />
                          {r.dq
                            ? "Excluido"
                            : r.tie_pending
                              ? "Desempate pendiente"
                              : (r.tie_reason ?? "Orden registrado")}
                        </Badge>
                      </summary>
                      <p>
                        {r.tie_reason || r.tie_pending || r.dq
                          ? tieExplanation(r, data.teams)
                          : "No hay un criterio de desempate individual registrado en esta clasificación histórica."}
                      </p>
                    </details>
                  </th>
                  <td className="points-cell">{r.points ?? "—"}</td>
                  <td className="difference-cell">
                    {r.dg > 0 ? "+" : ""}
                    {r.dg ?? "—"}
                  </td>
                  <td>
                    <span
                      className="form-strip"
                      aria-label="Últimos cinco partidos por jornada y orden"
                    >
                      {form.length ? (
                        form.map((m) => (
                          <span
                            key={m.id}
                            data-result={m.letter}
                            title={m.label}
                            aria-label={m.label}
                          >
                            {m.letter}
                          </span>
                        ))
                      ) : (
                        <span className="form-empty">Sin jugar</span>
                      )}
                    </span>
                  </td>
                  {[r.pj, r.pg, r.pp, r.pn, r.gf, r.gc].map((v, j) => (
                    <td className="secondary-stat" key={j}>
                      {v ?? "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="admin-note">
        V: victoria · D: derrota · N: nulo administrativo. Racha por jornada y
        orden del calendario. DG = GF − GC. La línea señala el corte; los
        descalificados no clasifican. PJ jugados, PG ganados, PP perdidos, PN
        nulos.
      </p>
      {data.state === "closed" && (
        <p className="locked-note">
          <LockKeyhole aria-hidden="true" />
          Clasificación final conservada.
        </p>
      )}
      {admin && data.state === "active" && (
        <details className="discipline-review">
          <summary>Descalificación administrativa</summary>
          <p>
            Sustituye todos los encuentros del equipo por 0–3, o nulo si ambos
            están descalificados. Conserva los resultados anteriores en el
            historial.
          </p>
          <form
            className="event-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void onAction("disqualify", {
                id: f.get("team"),
                reason: f.get("reason"),
              });
            }}
          >
            <label htmlFor="dq-team">Equipo habilitado</label>
            <select id="dq-team" name="team">
              {data.teams
                .filter((t) => !t.dq)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {names(t.id)}
                  </option>
                ))}
            </select>
            <label htmlFor="dq-reason">Motivo de descalificación</label>
            <input
              id="dq-reason"
              name="reason"
              required
              minLength={3}
              maxLength={1000}
            />
            <Button type="submit" variant="outline" disabled={busy}>
              Registrar descalificación
            </Button>
          </form>
        </details>
      )}
    </section>
  );
}
