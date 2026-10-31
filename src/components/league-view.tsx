"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { classificationZone } from "@/lib/public-matches";
import { getCrest } from "@/lib/crests";
import { localDate } from "@/lib/events";
import { leagueAction } from "@/app/admin/league-actions";
import { type League, type LeagueMatch, matchLabels } from "@/lib/league/types";
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
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();
  async function act(
    action: string,
    p: Record<string, unknown> = {
      reason: "Revisión administrativa confirmada",
    },
  ) {
    setBusy(true);
    try {
      setMessage(await leagueAction(eventId, action, p, data?.revision ?? 0));
      router.refresh();
    } catch {
      setMessage("No se pudo guardar. Recarga y vuelve a intentarlo.");
    } finally {
      setBusy(false);
    }
  }
  const teams = data?.teams ?? [];
  const team = (id: string) => teams.find((t) => t.id === id);
  const match = data?.matches?.find((m) => m.id === selected);
  function score(m: LeagueMatch) {
    return ["pending", "postponed", "replay"].includes(m.kind)
      ? "Por jugar"
      : `${m.hg} – ${m.ag}`;
  }
  function name(id: string) {
    const t = team(id);
    return (
      <span className="league-team">
        {t && (
          <Image src={getCrest(t.crest).src} alt="" width={36} height={36} />
        )}
        <span>
          {!admin && t ? <Link href={`/eventos/${eventId}/equipos/${id}`}>{t.name}</Link> : t?.name ?? id}
          {t?.dq ? " · Descalificado" : ""}
        </span>
      </span>
    );
  }
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
            <p role="status">{message}</p>
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
          <button
            className="action-link"
            disabled={busy}
            onClick={() => void act("confirm")}
          >
            Confirmar y fijar calendario
          </button>
        )}
      </div>
      <p role="status">{message}</p>
      {admin && data.state === "preview" && (
        <button
          className="trophy-button"
          disabled={busy}
          onClick={() => void act("regenerate")}
        >
          Volver a sortear la revisión previa
        </button>
      )}
      {tab === "standings" ? (
        <section className="admin-surface">
          <h2>
            Clasificación {data.state === "closed" ? "final" : "provisional"}
          </h2>
          <p>
            {data.format === "repechage"
              ? "Primeros 8 directos; 9–24 a repesca."
              : `Continúan los primeros ${data.qualified} habilitados.`}{" "}
            Sin eliminatorias automáticas.
          </p>
          <div
            className="league-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Tabla de clasificación"
          >
            <table className="league-table">
              <thead>
                <tr>
                  {[
                    "Pos.",
                    "Equipo",
                    "PJ",
                    "PG",
                    "PP",
                    "PN",
                    "GF",
                    "GC",
                    "DG",
                    "Puntos",
                  ].map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.table.map((r) => (
                  <tr key={r.id} data-zone={classificationZone(r,data).key}>
                    <td>
                      {r.tie_pending ? "=" : ""}
                      {r.position}
                    </td>
                    <th scope="row">
                      {name(r.id)}
                      <span className={`zone-label zone-${classificationZone(r,data).key}`}>{classificationZone(r,data).label}</span>
                      <small>
                        {r.dq
                          ? "Excluido · −12 puntos fijos y +100 GC administrativos"
                          : (r.tie_reason ?? "Puntos")}
                        {r.tie_pending ? " · Zona por resolver" : ""}
                        {!r.dq && !r.tie_pending && r.position <= data.qualified
                          ? data.format === "repechage" && r.position > 8
                            ? " · Repesca"
                            : " · Clasifica"
                          : ""}
                      </small>
                    </th>
                    {[r.pj, r.pg, r.pp, r.pn, r.gf, r.gc, r.dg, r.points].map(
                      (v, i) => (
                        <td key={i}>{v}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="admin-note">
            PJ: jugados; PG: ganados; PP: perdidos; PN: nulos; GF/GC: goles a
            favor/en contra; DG: diferencia. Empates marcados «=» siguen sin
            ordenar definitivamente.
          </p>
          {admin && data.state === "active" && (
            <>
              <h3>Revisión de cierre</h3>
              <p>
                Resuelve todos los partidos y luego los sorteos pendientes. Un
                cambio de resultado invalida los sorteos actuales y conserva su
                historial.
              </p>
              {[
                ...new Set(
                  data.table
                    .filter((r) => r.tie_pending)
                    .map((r) => r.tie_key!),
                ),
              ].map((key) => (
                <button
                  key={key}
                  className="trophy-button"
                  disabled={busy}
                  onClick={() =>
                    void act("lot", {
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
                </button>
              ))}
              <button
                className="action-link"
                disabled={busy}
                onClick={() => void act("close")}
              >
                Cerrar liguilla y conservar clasificación
              </button>
              <h3>Descalificación administrativa</h3>
              <p>
                Sustituye todos los encuentros del equipo por 0–3, o nulo si
                ambos están descalificados. Conserva los resultados anteriores
                en el historial.
              </p>
              <form
                className="event-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void act("disqualify", {
                    id: f.get("team"),
                    reason: f.get("reason"),
                  });
                }}
              >
                <label htmlFor="dq-team">Equipo habilitado</label>
                <select id="dq-team" name="team">
                  {teams
                    .filter((t) => !t.dq)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
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
                <button className="trophy-button" disabled={busy}>
                  Registrar descalificación
                </button>
              </form>
            </>
          )}
        </section>
      ) : (
        <section>
          {tab === "results" &&
            data.matches.every((m) =>
              ["pending", "postponed", "replay"].includes(m.kind),
            ) && (
              <p className="admin-surface">
                Todavía no hay resultados oficiales.
              </p>
            )}
          {Array.from({ length: data.rounds }, (_, i) => i + 1)
            .filter(
              (r) =>
                tab !== "results" ||
                data.matches.some(
                  (m) =>
                    m.round === r &&
                    !["pending", "postponed", "replay"].includes(m.kind),
                ),
            )
            .map((r) => (
              <section className="admin-surface league-round" key={r}>
                <h2>Jornada {r}</h2>
                <ol>
                  {data.matches
                    .filter(
                      (m) =>
                        m.round === r &&
                        (tab !== "results" ||
                          !["pending", "postponed", "replay"].includes(m.kind)),
                    )
                    .map((m) => (
                      <li key={m.id}>
                        <div className="league-fixture">
                          {name(m.home)}
                          <strong>{score(m)}</strong>
                          {name(m.away)}
                        </div>
                        <p>
                          {matchLabels[m.kind]} · Orden {m.game_order}
                          {m.scheduled_at
                            ? ` · ${eventDate(m.scheduled_at)}`
                            : " · Sin fecha asignada"}
                        </p>
                        {!admin && <Link href={`/eventos/${eventId}/partidos/${m.id}`}>{tab === "results" ? "Ver y compartir resultado" : "Detalle y calendario"}</Link>}
                        {admin && data.state === "active" && (
                          <button
                            className="trophy-button"
                            onClick={() => setSelected(m.id)}
                          >
                            Editar partido {m.game_order} · jornada {r}
                          </button>
                        )}
                      </li>
                    ))}
                </ol>
              </section>
            ))}
        </section>
      )}
      {admin && match && data.state === "active" && (
        <section className="admin-surface">
          <h2>Registrar o corregir partido</h2>
          <p>
            {team(match.home)?.name} contra {team(match.away)?.name}. Referencia
            habitual: 8:00 p. m. de Costa Rica; puedes programar varias jornadas
            el mismo día.
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
