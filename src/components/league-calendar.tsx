"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { TeamIdentity } from "./team-identity";
import { RoundSchedule } from "./round-schedule";
import { matchLabels, type League } from "@/lib/league/types";
import { unresolved } from "@/lib/public-matches";
import { knockoutDate } from "@/lib/knockout";

const weekday = new Intl.DateTimeFormat("es-CR", {
  weekday: "long", day: "numeric", month: "long", timeZone: "America/Costa_Rica",
});
const time = new Intl.DateTimeFormat("es-CR", {
  timeStyle: "short", timeZone: "America/Costa_Rica",
});

export function LeagueCalendar({
  data, eventId, admin, tab, locked, onSelect, startOperation, finishOperation, selected, editor,
}: {
  data: League;
  eventId: string;
  admin: boolean;
  tab: string;
  locked: boolean;
  startOperation: () => boolean;
  finishOperation: () => void;
  onSelect: (id: string | null, round: number) => void;
  selected?: string | null;
  editor?: ReactNode;
}) {
  const params = useSearchParams();
  const rounds = Array.from({ length: data.rounds }, (_, i) => i + 1);
  const requested = Number(params.get("jornada"));
  const remaining = data.matches.filter((match) => unresolved(match.kind));
  const round = rounds.includes(requested) ? requested
    : data.matches.find((match) => match.id === selected)?.round ?? (admin ? remaining[0]?.round : 1) ?? 1;
  const setRound = (r: number) => onSelect(null, r);
  const current = data.matches.filter((match) => match.round === round);
  const pending = current.filter((match) => unresolved(match.kind));
  const nextMatch = pending.some((match) => match.id === selected) ? undefined : pending[0];
  const nextRound = remaining.find((match) => match.round > round)?.round ?? remaining[0]?.round;

  function rows(j: number) {
    const visible = data.matches.filter((match) => match.round === j && (tab !== "results" || !unresolved(match.kind)));
    if (!visible.length) return <p>Esta jornada todavía no tiene resultados oficiales.</p>;
    return (
      <ol>
        {visible.map((m) => {
          const h = data.teams.find((t) => t.id === m.home);
          const a = data.teams.find((t) => t.id === m.away);
          const unplayed = unresolved(m.kind);
          const date = m.scheduled_at ? new Date(m.scheduled_at) : null;
          return (
            <li key={m.id} className="match-row">
              <div className="match-teams">
                <TeamIdentity name={h?.name ?? "Equipo"} crest={h?.crest}
                  href={admin ? undefined : "/eventos/" + eventId + "/equipos/" + m.home}
                  winner={!unplayed && m.hg > m.ag} />
                <strong className="match-center">{unplayed ? "VS" : m.hg + " – " + m.ag}</strong>
                <TeamIdentity name={a?.name ?? "Equipo"} crest={a?.crest}
                  href={admin ? undefined : "/eventos/" + eventId + "/equipos/" + m.away}
                  winner={!unplayed && m.ag > m.hg} />
              </div>
              <div className="match-row-meta">
                <Badge variant="outline">{admin && m.kind === "sport" ? "Finalizado" : matchLabels[m.kind]}</Badge>
                <span className="match-time">
                  <CalendarClock aria-hidden="true" />
                  {date && m.scheduled_at
                    ? admin ? weekday.format(date).replace(",", "").replace(/^./u, (c) => c.toUpperCase()) + " · " + time.format(date) : knockoutDate(m.scheduled_at)
                    : admin ? "Horario sin definir" : "Sin fecha"}
                </span>
                {admin && data.state === "active" && (
                  <button className="match-edit trophy-button" disabled={locked}
                    aria-expanded={selected === m.id}
                    onClick={() => onSelect(selected === m.id ? null : m.id, j)}>
                    {unplayed ? "Registrar resultado" : "Ver resultado"}
                  </button>
                )}
                {!admin && (
                  <Link className="match-detail-link" href={"/eventos/" + eventId + "/partidos/" + m.id}>
                    Detalle del partido
                  </Link>
                )}
              </div>
              {admin && selected === m.id && editor}
            </li>
          );
        })}
      </ol>
    );
  }

  if (!admin) return (
    <section className="league-calendar" id="league-calendar">
      <h2>{tab === "results" ? "Resultados por jornada" : "Calendario por jornadas"}</h2>
      <Tabs value={String(round)} onValueChange={(v) => setRound(Number(v))}>
        <TabsList className="round-tabs" aria-label="Jornadas">
          {rounds.map((j) => {
            const games = data.matches.filter((m) => m.round === j);
            return (
              <TabsTrigger key={j} value={String(j)}>
                Jornada {j}<span>{games.filter((m) => !unresolved(m.kind)).length}/{games.length} jugados</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {rounds.map((j) => (
          <TabsContent key={j} value={String(j)}>
            <section className="league-round"><h3>Jornada {j}</h3>{rows(j)}</section>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );

  const completed = current.length - pending.length;
  return (
    <section className="league-calendar guided-calendar" id="league-calendar">
      <header className="guided-round">
        <div>
          <h2>Jornada {round}</h2>
          <div role="status">
            {!pending.length && current.length > 0 ? (
              <><strong>Jornada {round} completada: {completed} de {current.length} partidos.</strong>
                <p>La clasificación está actualizada.</p></>
            ) : (
              <p>{completed} de {current.length} partidos jugados
                {data.state === "active" && <> · Faltan {pending.length} {pending.length === 1 ? "partido" : "partidos"}</>}
              </p>
            )}
          </div>
        </div>
        {data.state !== "preview" && (
          tab === "results" ? (
            <Link className="action-link" href={"/admin/calendario?evento=" + eventId + "&jornada=" + round}>Abrir calendario</Link>
          ) : !remaining.length ? (
            <Link className="action-link" href={"/admin/clasificacion?evento=" + eventId}>Ver clasificación final</Link>
          ) : !pending.length && nextRound ? (
            <button className="action-link" disabled={locked} onClick={() => setRound(nextRound)}>
              Ir a jornada {nextRound}
            </button>
          ) : nextMatch && (
            <button className="action-link" disabled={locked} onClick={() => onSelect(nextMatch.id, round)}>
              {selected ? "Registrar siguiente resultado" : "Registrar resultados"}
            </button>
          )
        )}
      </header>
      <nav className="guided-actions" aria-label="Navegar entre jornadas">
        <button className="trophy-button" disabled={locked || round <= 1} onClick={() => setRound(round - 1)}>Jornada anterior</button>
        <label className="guided-round-select">
          <span className="sr-only">Elegir jornada</span>
          <select value={round} disabled={locked} onChange={(e) => setRound(Number(e.target.value))}>
            {rounds.map((j) => <option key={j} value={j}>Jornada {j} de {data.rounds}</option>)}
          </select>
        </label>
        <button className="trophy-button" disabled={locked || round >= data.rounds} onClick={() => setRound(round + 1)}>Jornada siguiente</button>
      </nav>
      <section className="league-round" aria-label={"Partidos de la jornada " + round}>{rows(round)}</section>
      {tab !== "results" && data.state === "active" && (
        <details className="guided-options">
          <summary>Programar horarios</summary>
          <RoundSchedule key={eventId + "-" + round} data={data} eventId={eventId}
            round={round} locked={locked} startOperation={startOperation} finishOperation={finishOperation} />
        </details>
      )}
    </section>
  );
}
