"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCrest } from "@/lib/crests";
import { localDate } from "@/lib/events";
import { type Knockout, knockoutLabels, knockoutDate } from "@/lib/knockout";
import { knockoutAction } from "@/app/admin/knockout-actions";
import { ChampionPresentation } from "./champion";
export function KnockoutView({
  eventId,
  data,
  admin = false,
  mode = "bracket",
}: {
  eventId: string;
  data: Knockout | null;
  admin?: boolean;
  mode?: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [round, setRound] = useState(-1),
    [tracked, setTracked] = useState(""),
    [allRounds, setAllRounds] = useState(false);
  const router = useRouter();
  async function act(
    action: string,
    p: Record<string, unknown> = {
      reason: "Revisión explícita del propietario",
    },
  ) {
    setBusy(true);
    try {
      setMessage(await knockoutAction(eventId, action, p, data?.revision ?? 0));
      router.refresh();
    } catch {
      setMessage(
        "No se pudo guardar. Conserva tus datos y recarga para comprobar el estado.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <section className="admin-surface">
        <h2>Cuadro de eliminatorias</h2>
        <p>
          Se preparan desde la clasificación final de la liguilla cerrada. Debe
          haber suficientes equipos habilitados; no se añaden sustitutos ni
          pases libres.
        </p>
        {admin && (
          <Button disabled={busy} onClick={() => void act("preview")}>
            Preparar revisión del cuadro
          </Button>
        )}
        <p role="status">{message}</p>
      </section>
    );
  const matches = data.matches;
  const maxRound = Math.max(...matches.map((m) => m.round));
  const rounds = [...new Set(matches.map((m) => m.round))];
  const currentRound = round === -1 ? rounds[0] : round;
  const selectedMatch = matches.find((m) => m.id === selected);
  const path = new Set<string>();
  for (const m of matches.filter(m => tracked && (m.home === tracked || m.away === tracked))) {
    path.add(m.id);
    if ((m.winner && m.winner !== tracked) || data.teams.find(t=>t.id===tracked)?.dq) continue;
    let next = matches.find(n=>n.home_source === m.id || n.away_source === m.id);
    while(next) {path.add(next.id); if(next.winner && next.winner !== tracked)break; const id=next.id; next=matches.find(n=>n.home_source===id||n.away_source===id);}
  }
  const team = (id: string | null) => data.teams.find((t) => t.id === id);
  const roundName = (r: number) =>
    r === 0
      ? "Repesca"
      : r === maxRound
        ? "Final"
        : r === maxRound - 1
          ? "Semifinales"
          : r === maxRound - 2
            ? "Cuartos"
            : r === maxRound - 3
              ? "Octavos"
              : "Dieciseisavos";
  const participant = (id: string | null, source: string | null) => {
    const t = team(id);
    const parent = matches.find((m) => m.id === source);
    return t ? (
      <span className="ko-team">
        <Image src={getCrest(t.crest).src} alt="" width={40} height={40} />
        <span>
          {t.name}
          {t.dq ? " · Inhabilitado" : ""}
        </span>
      </span>
    ) : (
      <span>
        {parent?.kind === "void"
          ? "Sin ganador habilitado"
          : `Ganador del partido ${parent?.number ?? "por definir"}`}
      </span>
    );
  };
  function open(id: string) {
    setSelected(id);
    requestAnimationFrame(() => document.getElementById("ko-detail")?.focus());
  }
  const final = matches.find((m) => m.round === maxRound);
  const winner = team(final?.winner ?? null);
  return (
    <section className="ko-section">
      <h2>Cuadro de eliminatorias</h2>
      <p>
        {data.state === "preview"
          ? "Revisión previa · aún no confirmada"
          : data.state === "finished"
            ? "Evento terminado"
            : "Cuadro confirmado · a partido único"}
        . Los destinos son fijos, aunque gane el peor clasificado.
      </p>
      <p role="status">{message}</p>
      {data.champion && <ChampionPresentation champion={data.champion} />}
      <div className="admin-tabs">
        {admin && data.state === "preview" && (
          <Button disabled={busy} onClick={() => void act("confirm")}>
            Confirmar cuadro fijo
          </Button>
        )}
        {admin && data.state === "active" && (
          <div className="admin-surface">
            <h3>Revisar cierre del evento</h3>
            <p>
              {winner
                ? `Campeón propuesto: ${winner.name}. ${knockoutLabels[final!.kind]}.`
                : "La final todavía no tiene un ganador habilitado."}
            </p>
            <Button
              disabled={busy || !winner || winner.dq}
              onClick={() => void act("close")}
            >
              Confirmar campeón y terminar evento
            </Button>
          </div>
        )}
      </div>
      <label className="ko-round-switch" htmlFor="ko-round">
        Consultar ronda
        <select
          id="ko-round"
          value={currentRound}
          onChange={(e) => setRound(Number(e.target.value))}
        >
          {rounds.map((r) => (
            <option key={r} value={r}>
              {roundName(r)}
            </option>
          ))}
        </select>
      </label>
      <div className="bracket-controls"><label htmlFor="ko-team">Seguir equipo<select id="ko-team" value={tracked} onChange={e=>setTracked(e.target.value)}><option value="">Todos los equipos</option>{data.teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><Button className="ko-mobile-explore" variant="outline" aria-pressed={allRounds} onClick={()=>setAllRounds(!allRounds)}>{allRounds?"Vista cómoda por rondas":"Explorar cuadro completo"}</Button></div>
      {tracked && <p>Ruta resaltada de {team(tracked)?.name}: partidos disputados y destinos posibles si avanza. Los rivales y las conexiones permanecen fijos.</p>}
      <div
        className={`ko-bracket${allRounds ? " ko-all-rounds" : ""}`}
        role="region"
        aria-label="Cuadro y destinos de ganadores"
        tabIndex={0}
      >
        {rounds.map((r) => (
          <section
            key={r}
            className={
              currentRound === r ? "ko-column is-selected" : "ko-column"
            }
          >
            <h3>{roundName(r)}</h3>
            <ol>
              {matches
                .filter(
                  (m) =>
                    m.round === r &&
                    (mode !== "results" || m.winner || m.kind === "void"),
                )
                .map((m) => {
                  const next = matches.find(
                    (n) => n.home_source === m.id || n.away_source === m.id,
                  );
                  return (
                    <li
                      key={m.id}
                      id={`ko-game-${m.number}`}
                      className={`ko-match${path.has(m.id)?" ko-tracked":""}`}
                    >
                      <h4>Partido {m.number}</h4>
                      {path.has(m.id)&&<p className="ko-route-label">Ruta de {team(tracked)?.name}</p>}
                      <div
                        className={
                          m.winner === m.home && m.home ? "ko-winner" : ""
                        }
                      >
                        {participant(m.home, m.home_source)}
                        <strong>{m.hg ?? "—"}</strong>
                      </div>
                      <div
                        className={
                          m.winner === m.away && m.away ? "ko-winner" : ""
                        }
                      >
                        {participant(m.away, m.away_source)}
                        <strong>{m.ag ?? "—"}</strong>
                      </div>
                      <p>
                        {knockoutLabels[m.kind]} · Intento {m.attempt}
                      </p>
                      {m.scheduled_at && <p>{knockoutDate(m.scheduled_at)}</p>}
                      {m.winner && <p>Avanza: {team(m.winner)?.name}</p>}
                      {next && (
                        <a
                          className="ko-destination"
                          href={`#ko-game-${next.number}`}
                          onClick={() => setRound(next.round)}
                        >
                          Ganador → partido {next.number}
                          <ChevronRight size={18} />
                        </a>
                      )}
                      <Button variant="outline" onClick={() => open(m.id)}>
                        Detalle del partido {m.number}
                      </Button>
                      {!admin && <Link className="ko-public-link" href={`/eventos/${eventId}/partidos/${m.id}`}>{m.winner ? "Ver y compartir resultado" : "Detalle y calendario"}</Link>}
                    </li>
                  );
                })}
            </ol>
          </section>
        ))}
      </div>
      {selectedMatch && (
        <section
          className="admin-surface ko-detail"
          id="ko-detail"
          tabIndex={-1}
        >
          <h3>
            Partido {selectedMatch.number} · {roundName(selectedMatch.round)}
          </h3>
          <p>
            {participant(selectedMatch.home, selectedMatch.home_source)} contra{" "}
            {participant(selectedMatch.away, selectedMatch.away_source)}
          </p>
          <p>
            {knockoutLabels[selectedMatch.kind]} · Intento{" "}
            {selectedMatch.attempt}
          </p>
          <p>
            Cinco minutos; si empatan, siguiente gol. Cuatro goles de diferencia
            terminan el partido. Un pase por clasificación no añade goles.
          </p>
          {admin && data.state === "active" && (
            <>
              <form
                key={selectedMatch.id + data.revision}
                className="event-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const kind = String(f.get("kind"));
                  void act(
                    kind === "double_absence" || kind === "reset"
                      ? kind
                      : "match",
                    {
                      id: selectedMatch.id,
                      kind,
                      hg: Number(f.get("hg")),
                      ag: Number(f.get("ag")),
                      scheduled_at: selectedMatch.scheduled_at,
                      reason: f.get("reason"),
                    },
                  );
                }}
              >
                <label htmlFor="ko-kind">Decisión oficial</label>
                <select id="ko-kind" name="kind" defaultValue="sport">
                  {[
                    "sport",
                    "absence_home",
                    "absence_away",
                    "abandon_home",
                    "abandon_away",
                    "replay",
                    "postponed",
                  ].map((k) => (
                    <option key={k} value={k}>
                      {knockoutLabels[k]}
                    </option>
                  ))}
                  <option value="double_absence">
                    Doble ausencia · primer intento reprograma; segundo decide
                    clasificación
                  </option>
                  <option value="reset">
                    Retirar resultado para corregir una dependencia
                  </option>
                </select>
                <label htmlFor="ko-hg">Goles del local (solo deportivo)</label>
                <input
                  id="ko-hg"
                  name="hg"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={selectedMatch.hg ?? 0}
                />
                <label htmlFor="ko-ag">
                  Goles del visitante (solo deportivo)
                </label>
                <input
                  id="ko-ag"
                  name="ag"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={selectedMatch.ag ?? 0}
                />
                <label htmlFor="ko-reason">Motivo o corrección</label>
                <input
                  id="ko-reason"
                  name="reason"
                  required
                  minLength={3}
                  maxLength={1000}
                />
                <Button type="submit" disabled={busy}>Guardar decisión del partido</Button>
              </form>
              <form
                key={selectedMatch.id+"-schedule-"+data.revision}
                className="event-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const raw = String(f.get("date"));
                  void act("schedule", {
                    id: selectedMatch.id,
                    scheduled_at: raw
                      ? new Date(raw + ":00-06:00").toISOString()
                      : null,
                    reason: f.get("reason"),
                  });
                }}
              >
                <label htmlFor="ko-date">
                  Programar o reprogramar · hora de Costa Rica
                </label>
                <input
                  id="ko-date"
                  name="date"
                  type="datetime-local"
                  defaultValue={localDate(selectedMatch.scheduled_at)}
                />
                <label htmlFor="ko-schedule-reason">Motivo de la fecha</label>
                <input
                  id="ko-schedule-reason"
                  name="reason"
                  required
                  minLength={3}
                  maxLength={1000}
                />
                <Button type="submit" variant="outline" disabled={busy}>
                  Guardar fecha
                </Button>
              </form>
            </>
          )}
        </section>
      )}
      {admin && data.state === "active" && (
        <details className="admin-surface">
          <summary>Situación administrativa de un equipo</summary>
          <p>
            Registra únicamente una inhabilitación ya decidida por el
            propietario, con su motivo. No define sanciones para infracciones
            posteriores aún pendientes del reglamento y no cambia la liguilla
            cerrada. Los casos sin solución válida permanecen bloqueados.
          </p>
          <form
            className="event-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void act("ineligible", {
                id: f.get("team"),
                reason: f.get("reason"),
              });
            }}
          >
            <label htmlFor="ko-ineligible">Equipo</label>
            <select id="ko-ineligible" name="team">
              {data.teams
                .filter((t) => !t.dq)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <label htmlFor="ko-ineligible-reason">Decisión y motivo</label>
            <input
              id="ko-ineligible-reason"
              name="reason"
              required
              minLength={3}
              maxLength={1000}
            />
            <Button type="submit" variant="outline" disabled={busy}>
              Registrar inhabilitación confirmada
            </Button>
          </form>
        </details>
      )}
      {admin && (
        <details className="admin-surface">
          <summary>Historial privado del cuadro</summary>
          <ul>
            {data.history?.map((h, i) => (
              <li key={i}>
                {knockoutDate(h.at)} ·{" "}
                {{
                  preview: "Revisión del cuadro",
                  confirm: "Cuadro confirmado",
                  match: "Resultado corregido o registrado",
                  reset: "Resultado retirado",
                  double_absence: "Doble ausencia",
                  schedule: "Fecha programada",
                  ineligible: "Inhabilitación confirmada",
                  close: "Campeón confirmado",
                }[h.action] ?? h.action}{" "}
                · {h.reason}
                <details>
                  <summary>Consultar valores anteriores y nuevos</summary>
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
    </section>
  );
}
