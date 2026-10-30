import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import {
  eventColumns,
  eventDate,
  eventFormats,
  type TournamentEvent,
} from "@/lib/events";
export default async function Events() {
  const client = await requireOwner();
  const { data, error } = await client
    .from("cfp_events")
    .select(eventColumns)
    .order("starts_at");
  if (error) throw new Error("No se pudieron consultar los eventos.");
  return (
    <main>
      <p className="admin-note">
        Los borradores solo son visibles para ti. Abrir inscripciones requiere
        un evento publicado.
      </p>
      <ul className="admin-events">
        {(data as TournamentEvent[]).map((e) => (
          <li key={e.id}>
            <div>
              <h2>
                <Link href={`/admin/eventos/${e.id}`}>{e.name}</Link>
              </h2>
              <p>
                {eventFormats[e.format].label} · {eventDate(e.starts_at)}
              </p>
            </div>
            <div>
              <span className="admin-status">
                {e.status === "draft" ? "Borrador" : "Publicado"}
              </span>
              <span className="admin-status">
                Inscripciones{" "}
                {e.registration_status === "open" ? "abiertas" : "cerradas"}
              </span>
              <span>{e.capacity} plazas</span>
            </div>
            <Link href={`/admin/eventos/${e.id}`}>Configurar →</Link>
          </li>
        ))}
      </ul>
      {!data.length && (
        <div className="admin-empty">
          <h2>Aún no hay eventos</h2>
          <p>Prepara las fechas y el formato en un borrador privado.</p>
          <Link className="action-link" href="/admin/eventos/nuevo">
            Crear el primer evento
          </Link>
        </div>
      )}
    </main>
  );
}
