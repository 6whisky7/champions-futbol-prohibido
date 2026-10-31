"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LeagueCalendar } from "./league-calendar";
import { LeagueStandings } from "./league-standings";
import { SaveStatus } from "./save-status";
import { ConfirmAction } from "./confirm-action";
import { CompetitionAuditChanges } from "@/components/competition-audit-changes";
import { DrawReveal } from "@/components/draw-reveal";
import { localDate } from "@/lib/events";
import { leagueAction } from "@/app/admin/league-actions";
import { type League, matchLabels } from "@/lib/league/types";
function eventDate(value: string) {
  return (
    new Date(new Date(value).getTime() - 6 * 3600000)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ") + " · Costa Rica"
  );
}
export function LeagueView({
  eventId,
  data,
  admin = false,
  tab = "calendar",
}: {
  eventId: string;
  data: League | null;
  admin?: boolean;
  tab?: string;
}) {
  const params = useSearchParams();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const selected = params.get("partido");
  useEffect(() => {
    if (selected) document.getElementById("league-match-editor")?.focus();
  }, [selected]);
  const router = useRouter();
  async function act(
    action: string,
    p: Record<string, unknown> = {
      reason: "Revisión administrativa confirmada",
    },
  ) {
    setBusy(true);
    setMessage("");
    try {
      const result = await leagueAction(
        eventId,
        action,
        p,
        data?.revision ?? 0,
      );
      setMessage(result);
      if (result === "Guardado.") {
        router.refresh();
        window.dispatchEvent(new Event("cfp-admin-refresh"));
        return true;
      }
      return false;
    } catch {
      setMessage(
        "No se pudo confirmar el guardado. Conserva tus datos y revisa el calendario antes de repetir.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  const teams = data?.teams ?? [];
  const team = (id: string) => teams.find((t) => t.id === id);
  const match = data?.matches?.find((m) => m.id === selected);
  if (!data?.state)
    return (
      <section className="admin-surface">
        <h2>Preparar la liguilla</h2>
        {data?.readiness && (
          <>
            <p>
              {data.readiness.participants} equipos aprobados.{" "}
              {data.readiness.qualified} plazas de clasificación.
            </p>
            <ul>
              {data.readiness.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
        {admin ? (
          <>
            <p>
              El sorteo genera todos los rivales y jornadas juntos. La espera no
              participa. Primero revisa y después confirma.
            </p>
            <button
              className="action-link"
              disabled={busy || !data?.readiness?.ready}
              onClick={() => void act("preview")}
            >
              Generar revisión del calendario
            </button>
            <SaveStatus busy={busy} message={message} />
          </>
        ) : (
          <p>El calendario todavía no está confirmado.</p>
        )}
      </section>
    );
  return (
    <>
      <div className="admin-event-banner">
        <p>
          {data.state === "preview"
            ? "Revisión previa · sin iniciar"
            : data.state === "closed"
              ? "Liguilla cerrada"
              : "Liguilla en curso"}{" "}
          · {data.rounds} jornadas · {teams.length} equipos
        </p>
        {admin && data.state === "preview" && (
          <ConfirmAction
            label="Confirmar y fijar calendario"
            title="Fijar participantes y calendario"
            description="Se conservan los equipos, el formato y los rivales de esta revisión. Las inscripciones se cierran y las plantillas quedan fijadas. No se incorporan equipos de espera automáticamente."
            busy={busy}
            message={message}
            onConfirm={() => act("confirm")}
          />
        )}
      </div>
      <SaveStatus busy={busy} message={message} />
      {admin && data.state === "preview" && (
        <button
          className="trophy-button"
          disabled={busy}
          onClick={() => void act("regenerate")}
        >
          Volver a sortear la revisión previa
        </button>
      )}
      {admin && tab === "calendar" && (
        <details className="draw-disclosure">
          <summary>Revelar el calendario guardado</summary>
          <DrawReveal
            key={data.seed}
            preview={data.state === "preview"}
            matches={data.matches.map((m) => ({
              id: m.id,
              phase: `Jornada ${m.round} · partido ${m.game_order}`,
              homeName: team(m.home)?.name ?? "Por definir",
              awayName: team(m.away)?.name ?? "Por definir",
            }))}
          />
        </details>
      )}
      {tab === "standings" ? (
        <LeagueStandings
          data={data}
          eventId={eventId}
          admin={admin}
          busy={busy}
          message={message}
          onAction={act}
        />
      ) : (
        <LeagueCalendar data={data} eventId={eventId} admin={admin} tab={tab} />
      )}
      {admin && match && data.state === "active" && (
        <section
          className="admin-surface"
          id="league-match-editor"
          tabIndex={-1}
        >
          <h2>Registrar o corregir partido</h2>
          <p>
            {team(match.home)?.name} contra {team(match.away)?.name}.
          </p>
          <form
            key={match.id + data.revision}
            className="event-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const date = String(f.get("date") ?? "");
              void act("match", {
                id: match.id,
                kind: f.get("kind"),
                hg: Number(f.get("hg")),
                ag: Number(f.get("ag")),
                scheduled_at: date
                  ? new Date(date + ":00-06:00").toISOString()
                  : null,
                reason: f.get("reason"),
              });
            }}
          >
            <label htmlFor="match-state">Estado o decisión</label>
            <select id="match-state" name="kind" defaultValue={match.kind}>
              {Object.entries(matchLabels).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <label htmlFor="home-goals">Goles del local</label>
            <input
              id="home-goals"
              name="hg"
              type="number"
              min={0}
              step={1}
              defaultValue={match.hg}
              required
            />
            <label htmlFor="away-goals">Goles del visitante</label>
            <input
              id="away-goals"
              name="ag"
              type="number"
              min={0}
              step={1}
              defaultValue={match.ag}
              required
            />
            <p>
              Los marcadores administrativos se asignan según la decisión. Un
              resultado deportivo exige ganador; puede tener más de cuatro goles
              totales.
            </p>
            <label htmlFor="match-date">
              Fecha y hora de Costa Rica (opcional)
            </label>
            <input
              id="match-date"
              name="date"
              type="datetime-local"
              defaultValue={localDate(match.scheduled_at)}
            />
            <label htmlFor="match-reason">
              Motivo del registro o corrección
            </label>
            <input
              id="match-reason"
              name="reason"
              required
              minLength={3}
              maxLength={1000}
            />
            <button className="action-link" disabled={busy}>
              Guardar partido
            </button>
          </form>
        </section>
      )}
      {admin && (
        <details className="admin-surface">
          <summary>Historial privado de la competición</summary>
          <p>
            Volver a sortear solo está disponible en revisión previa. Las
            correcciones conservan la auditoría y no reorganizan un calendario
            confirmado.
          </p>
          <ul>
            {data.history?.map((h, i) => (
              <li key={i}>
                {eventDate(h.at)} ·{" "}
                {{
                  preview: "Revisión del sorteo",
                  regenerate: "Nuevo sorteo previo",
                  confirm: "Calendario confirmado",
                  match: "Partido registrado o reprogramado",
                  lot: "Sorteo de desempate",
                  disqualify: "Descalificación",
                  close: "Cierre de liguilla",
                }[h.action] ?? h.action}{" "}
                · {h.reason}
                <CompetitionAuditChanges
                  before={h.before_value}
                  after={h.after_value}
                  teams={teams}
                />
                {h.actor && (
                  <details>
                    <summary>Quién realizó la acción</summary>
                    <p>Usuario verificado: {h.actor}</p>
                  </details>
                )}
                <details>
                  <summary>Valores anteriores y nuevos</summary>
                  <pre className="league-audit">
                    {JSON.stringify(
                      { antes: h.before_value, despues: h.after_value },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
