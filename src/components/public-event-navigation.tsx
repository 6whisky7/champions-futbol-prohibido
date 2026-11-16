import Link from "next/link";
import type { TournamentEvent } from "@/lib/events";

export function EventStatus({ status, registrationOpen }: {
  status: TournamentEvent["status"];
  registrationOpen: boolean;
}) {
  const display = status === "finished" ? ["finished", "Finalizado"]
    : registrationOpen ? ["open", "Inscripciones abiertas"] : ["closed", "Inscripciones cerradas"];
  return <span className="public-event-state" data-state={display[0]}>{display[1]}</span>;
}

const sections = [
  ["resumen", "Resumen"], ["calendario", "Calendario"], ["resultados", "Resultados"],
  ["clasificacion", "Clasificación"], ["eliminatorias", "Eliminatorias"],
];

export function PublicEventNavigation({ eventId, current, visible, featured }: {
  eventId: string;
  current?: string;
  visible?: string[];
  featured?: string;
}) {
  const base = "/eventos/" + eventId;
  return (
    <nav className="public-event-nav" aria-label="Competición del evento">
      {sections.filter(([section]) => !visible || visible.includes(section)).map(([section, label]) => (
        <Link key={section}
          className={section === featured ? "action-link" : undefined}
          aria-current={current === section ? "page" : undefined}
          href={section === "resumen" ? base : base + "/" + section}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
