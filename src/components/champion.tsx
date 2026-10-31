import Image from "next/image";
import Link from "next/link";
import { Download, Trophy } from "lucide-react";
import { getCrest } from "@/lib/crests";
import {
  type Champion,
  type KnockoutMatch,
  type KnockoutTeam,
  knockoutLabels,
} from "@/lib/knockout";
import { RosterLineup } from "./roster-lineup";
import { TeamIdentity } from "./team-identity";
export function ChampionPresentation({
  champion,
  eventId,
  matches = [],
  teams = [],
}: {
  champion: Champion;
  eventId?: string;
  matches?: KnockoutMatch[];
  teams?: KnockoutTeam[];
}) {
  const { team, runner_up, final } = champion;
  const lookup = (id: string | null) =>
    teams.find((t) => t.id === id) ??
    [team, runner_up].find((t) => t?.id === id);
  const maxRound = Math.max(final.round, ...matches.map((m) => m.round));
  const roundName = (r: number) =>
    r === 0
      ? "Repesca"
      : r === maxRound
        ? "Final"
        : r === maxRound - 1
          ? "Semifinal"
          : r === maxRound - 2
            ? "Cuartos"
            : r === maxRound - 3
              ? "Octavos"
              : "Dieciseisavos";
  const path = matches
    .filter(
      (m) => m.winner === team.id && (m.home === team.id || m.away === team.id),
    )
    .sort((a, b) => a.round - b.round || a.number - b.number);
  const home = lookup(final.home),
    away = lookup(final.away);
  return (
    <section className="champion-presentation" aria-label="Campeón del evento">
      <div className="champion-stage">
        <div className="champion-trophy">
          <Image
            src="/trofeo/cfp-v03-poster.webp"
            alt="Trofeo V03 de Champions Fútbol Prohibido"
            width={720}
            height={1080}
          />
        </div>
        <div className="champion-title">
          <span className="achievement-label">
            <Trophy aria-hidden="true" />
            Campeón
          </span>
          <p>{champion.event_name} · edición terminada</p>
          <Image
            className="champion-crest"
            src={getCrest(team.crest).src}
            alt={`Escudo de ${team.name}`}
            width={176}
            height={176}
          />
          <h2>{team.name}</h2>
          <p className="finalist-label">
            Finalista: {runner_up?.name ?? "Sin rival habilitado en la final"}
          </p>
          {eventId && (
            <Link
              className="trophy-button"
              href={`/eventos/${eventId}/campeon/imagen`}
              prefetch={false}
            >
              <Download aria-hidden="true" />
              Tarjeta vertical · 1080 × 1920
            </Link>
          )}
        </div>
      </div>
      <section className="champion-final">
        <h3>La final</h3>
        <div className="match-teams">
          <TeamIdentity
            name={home?.name ?? "Sin rival habilitado"}
            crest={home?.crest}
            winner={final.home === team.id}
          />
          <strong className="champion-final-score">
            {final.hg !== null && final.ag !== null
              ? `${final.hg} – ${final.ag}`
              : "Sin marcador"}
          </strong>
          <TeamIdentity
            name={away?.name ?? "Sin rival habilitado"}
            crest={away?.crest}
            winner={final.away === team.id}
          />
        </div>
        <p
          className={final.kind === "sport" ? "" : "administrative-resolution"}
        >
          {knockoutLabels[final.kind]}
          {final.hg === null ? " · no añade goles deportivos." : ""}
        </p>
      </section>
      <section className="champion-roster">
        <h3>Plantilla oficial</h3>
        <RosterLineup members={team.members} />
      </section>
      {path.length > 0 && (
        <section className="champion-path">
          <h3>Camino al título</h3>
          <ol>
            {path.map((m) => {
              const rival = lookup(m.home === team.id ? m.away : m.home);
              return (
                <li key={m.id}>
                  <strong>{roundName(m.round)}</strong>
                  <span>{rival?.name ?? "Sin rival habilitado"}</span>
                  <span>
                    {m.hg !== null && m.ag !== null
                      ? `${m.hg} – ${m.ag}`
                      : "Sin marcador"}{" "}
                    · {knockoutLabels[m.kind]}
                  </span>
                  {eventId && (
                    <Link href={`/eventos/${eventId}/partidos/${m.id}`}>
                      Ver resolución
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="admin-note">
            Solo avances registrados del campeón. Un pase administrativo no
            representa un partido deportivo jugado.
          </p>
        </section>
      )}
    </section>
  );
}
