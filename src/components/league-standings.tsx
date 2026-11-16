"use client";
import { LeagueTable } from "./league-table";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import type { League } from "@/lib/league/types";
import { unresolved } from "@/lib/public-matches";
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
  return (
    <section className="admin-surface standings-surface">
      {admin && data.state === "active" && remaining === 0 && (
        <section className="closure-review" id="league-close" tabIndex={-1}>
          <h2>{lots.length ? "Desempates pendientes" : "Ya puedes cerrar la liguilla"}</h2>
          <p id="league-close-block">
            {lots.length
              ? "Hay equipos empatados. Debes resolver estos empates antes de cerrar la liguilla."
              : "Todos los partidos están finalizados. Revisa las posiciones antes de fijar la clasificación."}
          </p>
          {lots.map((key) => {
            const teams = data.table.filter((row) => row.tie_key === key).map((row) => row.name).join(", ");
            return (
              <div key={key} className="guided-tie">
                <p>{teams}</p>
                <ConfirmAction label="Resolver desempate" title="Sortear puestos empatados"
                  description={"Se sorteará el orden de estos equipos según el reglamento: " + teams + "."}
                  busy={busy} message={message}
                  onConfirm={() => onAction("lot", { key, reason: "Sorteo explícito de puestos empatados" })} />
              </div>
            );
          })}
          {!lots.length && (
            <ConfirmAction
              label="Cerrar liguilla y continuar"
              title="Fijar la clasificación final"
              description="Los puestos y resultados de la liguilla quedarán fijados. El cuadro de eliminatorias se prepara en el siguiente paso."
              busy={busy}
              message={message}
              onConfirm={() => onAction("close")}
            />
          )}
        </section>
      )}
      {admin && data.state === "closed" && (
        <div className="closure-review">
          <h2>Clasificación final confirmada</h2>
          <Link className="action-link" href={"/admin/eliminatorias?evento=" + eventId}>
            {data.format === "quarters" ? "Continuar a cuartos de final" : "Continuar a eliminatorias"}
          </Link>
        </div>
      )}
      <LeagueTable data={data} played={data.matches.length - remaining} eventId={admin ? undefined : eventId} />
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
