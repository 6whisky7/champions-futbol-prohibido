"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { MatchChoice } from "@/lib/admin-match-choices";
import { LeagueCalendar } from "./league-calendar";
import { LeagueStandings } from "./league-standings";
import { SaveStatus } from "./save-status";
import { ConfirmAction } from "./confirm-action";
import { CompetitionAuditChanges } from "@/components/competition-audit-changes";
import { DrawReveal } from "@/components/draw-reveal";
import { LeagueMatchEditor, type EditMode, type ScoreDraft } from "./league-match-editor";
import { leagueAction, saveLeagueMatch } from "@/app/admin/league-actions";
import { type League, type LeagueMatch } from "@/lib/league/types";
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
  data: initial,
  admin = false,
  tab = "calendar",
  bracketChoices,
  liveMatches,
}: {
  eventId: string;
  data: League | null;
  admin?: boolean;
  tab?: string;
  bracketChoices?: MatchChoice[];
  liveMatches?: string[];
}) {
  const params = useSearchParams();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState<League>();
  const data = snapshot && snapshot.revision > (initial?.revision ?? -1) ? snapshot : initial;
  const [confirmation, setConfirmation] = useState<{ id: string; version: number; text: string }>();
  const [matchError, setMatchError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});
  const [refreshing, startRefresh] = useTransition();
  const saving = useRef(false);
  const selected = params.get("partido");
  const locked = busy || refreshing;
  function startOperation() {
    if (saving.current || locked) return false;
    saving.current = true;
    setBusy(true);
    return true;
  }
  function finishOperation() {
    saving.current = false;
    setBusy(false);
  }
  function selectMatch(id: string | null, round: number) {
    if (saving.current || locked) return;
    setMatchError("");
    setMessage("");
    setConfirmation(undefined);
    const url = new URL(window.location.href);
    url.searchParams.set("jornada", String(round));
    if (id) url.searchParams.set("partido", id);
    else url.searchParams.delete("partido");
    window.history.replaceState(null, "", url);
  }
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
    if (!startOperation()) return false;
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
        startRefresh(() => router.refresh());
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
      finishOperation();
    }
  }
  async function persistMatch(form: FormData, match: LeagueMatch, mode: EditMode) {
    if (!data || !startOperation()) return;
    setMessage("");
    setMatchError("");
    setConfirmation(undefined);
    try {
      const reason = String(form.get("reason") ?? "");
      const edit = mode === "score"
        ? { mode, home: Number(form.get("hg")), away: Number(form.get("ag")), reason }
        : mode === "schedule"
          ? { mode, date: String(form.get("date") ?? "") }
          : { mode, kind: String(form.get("kind") ?? ""), reason };
      const result = await saveLeagueMatch(eventId, match.id, data.revision, match.version, edit);
      if (result.ok) {
        setSnapshot(result.league);
        setConfirmation({
          id: match.id,
          version: result.match.version,
          text: mode === "score" ? "Resultado guardado correctamente"
            : mode === "schedule" ? "Horario guardado correctamente" : "Decisión guardada correctamente",
        });
        window.dispatchEvent(new Event("cfp-admin-refresh"));
      } else setMatchError(result.message);
    } catch {
      setMatchError("No se pudo confirmar el guardado. Revisa el partido en otra pestaña antes de volver a intentarlo.");
    } finally {
      finishOperation();
    }
  }
  const teams = data?.teams ?? [];
  const team = (id: string) => teams.find((t) => t.id === id);
  const match = data?.matches?.find((m) => m.id === selected);
  const editorKey = match ? match.id + ":" + match.version : "";
  const readOnlyReason = data?.state === "closed" ? "La clasificación final ya está confirmada."
    : match && (team(match.home)?.dq || team(match.away)?.dq) ? "El marcador corresponde a una descalificación." : undefined;
  if (!data?.state)
    return (
      <section className={admin ? "admin-surface" : "public-event-empty"}>
        <h2>{admin ? "Preparar la liguilla" : tab === "results" ? "Resultados" : "Calendario"}</h2>
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
              disabled={locked || !data?.readiness?.ready}
              onClick={() => void act("preview")}
            >
              Preparar calendario
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
      {(!admin || data.state === "preview") && <div className="admin-event-banner">
        <p>
          {data.state === "preview"
            ? "El calendario está listo para revisar"
            : data.state === "closed"
              ? "Liguilla cerrada"
              : "Liguilla en curso"}{" "}
          · {data.rounds} jornadas · {teams.length} equipos
        </p>
        {admin && data.state === "preview" && (
          <ConfirmAction
            label="Confirmar calendario e iniciar liguilla"
            title="Fijar participantes y calendario"
            description="Se conservan los equipos, el formato y los rivales de esta revisión. Las inscripciones se cierran y las plantillas quedan fijadas. No se incorporan equipos de espera automáticamente."
            busy={busy}
            message={message}
            onConfirm={() => act("confirm")}
          />
        )}
      </div>}
      <SaveStatus busy={busy} message={message} />
      {tab === "standings" ? (
        <LeagueStandings
          data={data}
          eventId={eventId}
          admin={admin}
          busy={locked}
          message={message}
          onAction={act}
        />
      ) : (
        <LeagueCalendar
          data={data}
          eventId={eventId}
          admin={admin}
          tab={tab}
          locked={locked}
          onSelect={selectMatch}
          startOperation={startOperation}
          finishOperation={finishOperation}
          selected={selected}
          bracketChoices={bracketChoices}
          liveMatches={liveMatches}
          editor={admin && match && data.state !== "preview" && (
            <LeagueMatchEditor
              key={editorKey}
              match={match}
              names={[team(match.home)?.name ?? "local", team(match.away)?.name ?? "visitante"]}
              locked={locked}
              busy={busy}
              error={matchError}
              saved={confirmation?.id === match.id && confirmation.version === match.version ? confirmation.text : undefined}
              draft={drafts[editorKey]}
              readOnlyReason={readOnlyReason}
              onDraft={(draft) => setDrafts((previous) => ({ ...previous, [editorKey]: draft }))}
              onSave={(form, mode) => void persistMatch(form, match, mode)}
            />
          )}
        />
      )}
      {admin && tab === "calendar" && (
        <details className="draw-disclosure">
          <summary>Sorteo y calendario guardado</summary>
          {data.state === "preview" && (
            <button className="trophy-button" disabled={locked} onClick={() => void act("regenerate")}>
              Volver a sortear
            </button>
          )}
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
