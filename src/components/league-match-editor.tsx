"use client";

import { useState } from "react";
import type { LeagueMatch } from "@/lib/league/types";
import { matchLabels } from "@/lib/league/types";
import { unresolved } from "@/lib/public-matches";
import { localDate } from "@/lib/events";

export type EditMode = "score" | "schedule" | "decision";
export type ScoreDraft = { hg: string; ag: string; reason: string };

export function LeagueMatchEditor({
  match, names, locked, busy, error, saved, draft, readOnlyReason, onDraft, onSave,
}: {
  match: LeagueMatch;
  names: [string, string];
  locked: boolean;
  busy: boolean;
  error: string;
  saved?: string;
  draft?: ScoreDraft;
  readOnlyReason?: string;
  onDraft: (draft: ScoreDraft) => void;
  onSave: (form: FormData, mode: EditMode) => void;
}) {
  const [correcting, setCorrecting] = useState(false);
  const pending = unresolved(match.kind);
  const score = draft ?? {
    hg: pending ? "" : String(match.hg),
    ag: pending ? "" : String(match.ag),
    reason: "",
  };

  if (readOnlyReason) return (
    <section className="guided-match-editor" id="league-match-editor" tabIndex={-1}
      aria-labelledby="league-match-title">
      <h3 id="league-match-title">Resultado del partido</h3>
      <p>{names[0]} {match.hg} – {match.ag} {names[1]}</p>
      <p className="admin-note">{readOnlyReason}</p>
    </section>
  );

  return (
    <section className="guided-match-editor" id="league-match-editor" tabIndex={-1}
      aria-labelledby="league-match-title" aria-busy={busy}>
      <h3 id="league-match-title">
        {pending ? "Registrar resultado" : correcting ? "Corregir resultado" : "Resultado del partido"}
      </h3>
      {saved && <p role="status" className="save-status" data-state="saved">{saved}</p>}
      {error && <p role="alert" className="save-status" data-state="error">{error}</p>}
      {pending || correcting ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(new FormData(e.currentTarget), "score");
        }}>
          <fieldset disabled={locked} className="guided-score-fields">
            {(["hg", "ag"] as const).map((name, index) => (
              <label key={name} htmlFor={index === 0 ? "home-goals" : "away-goals"}>
                Goles de {names[index]}
                <input
                  id={index === 0 ? "home-goals" : "away-goals"}
                  name={name} inputMode="numeric" type="number" min={0} step={1}
                  value={score[name]} required
                  onChange={(e) => onDraft({ ...score, [name]: e.target.value })}
                />
              </label>
            ))}
            {!pending && (
              <label className="guided-score-wide" htmlFor="match-reason">
                Motivo de la corrección
                <input id="match-reason" name="reason" minLength={3} maxLength={1000}
                  required value={score.reason}
                  onChange={(e) => onDraft({ ...score, reason: e.target.value })} />
              </label>
            )}
            <div className="guided-score-wide guided-actions">
              <button className="action-link" type="submit">
                {busy ? "Guardando…" : pending ? "Guardar resultado" : "Guardar corrección"}
              </button>
              {correcting && <button type="button" className="trophy-button" onClick={() => setCorrecting(false)}>Cancelar</button>}
            </div>
          </fieldset>
        </form>
      ) : (
        <button className="trophy-button" disabled={locked} onClick={() => setCorrecting(true)}>
          Corregir resultado
        </button>
      )}
      <details className="guided-options">
        <summary>Más opciones del partido</summary>
        <form className="event-form" onSubmit={(e) => {
          e.preventDefault();
          onSave(new FormData(e.currentTarget), "schedule");
        }}>
          <fieldset className="event-form" disabled={locked}>
            <label htmlFor="match-date">Fecha y hora de Costa Rica</label>
            <input id="match-date" name="date" type="datetime-local" defaultValue={localDate(match.scheduled_at)} />
            <button className="trophy-button" type="submit">Guardar horario</button>
          </fieldset>
        </form>
        <form className="event-form" onSubmit={(e) => {
          e.preventDefault();
          onSave(new FormData(e.currentTarget), "decision");
        }}>
          <fieldset className="event-form" disabled={locked}>
            <label htmlFor="match-state">Decisión del partido</label>
            <p id="league-decision-help" className="admin-note">
              La ausencia se registra antes de jugar. El abandono ocurre con el partido iniciado.
              Si la sala cae para ambos equipos, elige «Repetir desde cero».
            </p>
            <select id="match-state" name="kind" defaultValue="" aria-describedby="league-decision-help" required>
              <option value="" disabled>Selecciona una decisión</option>
              {Object.entries(matchLabels).filter(([kind]) => kind !== "sport").map(([kind, label]) => (
                <option key={kind} value={kind}>{label}</option>
              ))}
            </select>
            <label htmlFor="decision-reason">Motivo de la decisión</label>
            <input id="decision-reason" name="reason" minLength={3} maxLength={1000} required />
            <button className="trophy-button" type="submit">Guardar decisión</button>
          </fieldset>
        </form>
      </details>
    </section>
  );
}
