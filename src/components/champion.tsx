import Image from "next/image";
import { getCrest } from "@/lib/crests";
import { type Champion, knockoutLabels } from "@/lib/knockout";
export function ChampionPresentation({ champion }: { champion: Champion }) {
  const { team, runner_up, final } = champion;
  return (
    <section className="champion-stage" aria-label="Campeón del evento">
      <div className="champion-trophy">
        <Image
          src="/trofeo/cfp-v03-poster.webp"
          alt="Trofeo V03 de Champions Fútbol Prohibido"
          width={720}
          height={1080}
        />
      </div>
      <div>
        <p>Evento terminado · {champion.event_name}</p>
        <h2>Campeón</h2>
        <Image
          className="champion-crest"
          src={getCrest(team.crest).src}
          alt={`Escudo de ${team.name}`}
          width={120}
          height={120}
        />
        <h3>{team.name}</h3>
        <p>
          Final:{" "}
          {final.hg === null
            ? knockoutLabels[final.kind]
            : `${final.hg}–${final.ag} · ${knockoutLabels[final.kind]}`}
        </p>
        <p>
          Subcampeón: {runner_up?.name ?? "Sin rival habilitado en la final"}
        </p>
        <h4>Plantilla oficial</h4>
        <ul>
          {team.members.map((m, i) => (
            <li key={i}>
              {m.roblox} · {m.role}
              {m.captain ? " · Capitán" : ""}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
