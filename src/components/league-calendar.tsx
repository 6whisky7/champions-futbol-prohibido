"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil, CalendarClock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { TeamIdentity } from "./team-identity";
import { RoundSchedule } from "./round-schedule";
import { matchLabels, type League } from "@/lib/league/types";
import { unresolved } from "@/lib/public-matches";
import { knockoutDate as eventDate } from "@/lib/knockout";
export function LeagueCalendar({
  data,
  eventId,
  admin,
  tab,
}: {
  data: League;
  eventId: string;
  admin: boolean;
  tab: string;
}) {
  const params = useSearchParams(),
    r = Number(params.get("jornada")),
    round = Number.isInteger(r) && r > 0 && r <= data.rounds ? r : 1;
  const setRound = (r: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("jornada", String(r));
    url.searchParams.delete("partido");
    window.history.replaceState(null, "", url);
  };
  return (
    <section className="league-calendar" id="league-calendar">
      <h2>
        {tab === "results"
          ? "Resultados por jornada"
          : "Calendario por jornadas"}
      </h2>
      <Tabs value={String(round)} onValueChange={(v) => setRound(Number(v))}>
        <TabsList className="round-tabs" aria-label="Jornadas">
          {Array.from({ length: data.rounds }, (_, i) => i + 1).map((j) => {
            const rows = data.matches.filter((m) => m.round === j);
            return (
              <TabsTrigger key={j} value={String(j)}>
                Jornada {j}{" "}
                <span>
                  {rows.filter((m) => !unresolved(m.kind)).length}/{rows.length}{" "}
                  jugados
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {Array.from({ length: data.rounds }, (_, i) => i + 1).map((j) => (
          <TabsContent key={j} value={String(j)}>
            <section className="league-round">
              <h3>Jornada {j}</h3>
              {admin && data.state === "active" && (
                <RoundSchedule
                  key={eventId + "-" + j}
                  data={data}
                  eventId={eventId}
                  round={j}
                />
              )}
              <ol>
                {data.matches
                  .filter(
                    (m) =>
                      m.round === j &&
                      (tab !== "results" || !unresolved(m.kind)),
                  )
                  .map((m) => {
                    const h = data.teams.find((t) => t.id === m.home),
                      a = data.teams.find((t) => t.id === m.away),
                      pending = unresolved(m.kind);
                    return (
                      <li key={m.id} className="match-row">
                        <div className="match-teams">
                          <TeamIdentity
                            name={h?.name ?? "Equipo"}
                            crest={h?.crest}
                            href={
                              !admin
                                ? `/eventos/${eventId}/equipos/${m.home}`
                                : undefined
                            }
                            winner={!pending && m.hg > m.ag}
                          />
                          <strong className="match-center">
                            {pending ? "VS" : `${m.hg} – ${m.ag}`}
                          </strong>
                          <TeamIdentity
                            name={a?.name ?? "Equipo"}
                            crest={a?.crest}
                            href={
                              !admin
                                ? `/eventos/${eventId}/equipos/${m.away}`
                                : undefined
                            }
                            winner={!pending && m.ag > m.hg}
                          />
                        </div>
                        <div className="match-row-meta">
                          <Badge variant="outline">{matchLabels[m.kind]}</Badge>
                          <Badge
                            variant="outline"
                            className={!m.scheduled_at ? "date-missing" : ""}
                          >
                            <CalendarClock aria-hidden="true" />
                            {m.scheduled_at
                              ? eventDate(m.scheduled_at)
                              : "Sin fecha"}
                          </Badge>
                          {admin && data.state === "active" ? (
                            <button
                              className="match-edit trophy-button"
                              onClick={() => {
                                const url = new URL(window.location.href);
                                url.searchParams.set("partido", m.id);
                                window.history.replaceState(null, "", url);
                              }}
                            >
                              <Pencil aria-hidden="true" />
                              Editar partido {m.game_order} · jornada {j}
                            </button>
                          ) : (
                            <Link
                              className="match-detail-link"
                              href={`/eventos/${eventId}/partidos/${m.id}`}
                            >
                              Detalle del partido
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ol>
              {tab === "results" &&
                !data.matches.some(
                  (m) => m.round === j && !unresolved(m.kind),
                ) && (
                  <p className="admin-note">
                    Esta jornada todavía no tiene resultados oficiales.
                  </p>
                )}
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
