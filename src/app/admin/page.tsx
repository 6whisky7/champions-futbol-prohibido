import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { eventColumns, eventDate, type TournamentEvent } from "@/lib/events";
import { signOut } from "./actions";
export const dynamic = "force-dynamic";
export default async function Admin() {
  const client = await requireOwner();
  const { data, error } = await client.from("cfp_events").select(eventColumns).order("starts_at");
  if (error) throw new Error("No se pudieron consultar los eventos.");
  return <main className="management-page page-width"><Link href="/">← Inicio</Link><div className="management-heading"><h1>Administrar eventos</h1><form action={signOut}><button className="trophy-button">Cerrar sesión</button></form></div>
    <p>Los borradores son privados. Tú decides cuándo abrir cada evento.</p><nav className="admin-tabs" aria-label="Administración"><Link className="action-link" href="/admin/eventos/nuevo">Crear evento</Link><Link className="trophy-button" href="/admin/solicitudes">Solicitudes, equipos y lista de espera →</Link></nav>
    <ul className="event-list">{(data as TournamentEvent[]).map(e => <li key={e.id}><h2><Link href={`/admin/eventos/${e.id}`}>{e.name}</Link></h2><p>{eventDate(e.starts_at)} · {e.status === "published" ? "Publicado" : "Borrador"} · {e.capacity} equipos</p><Link href={`/admin/eventos/${e.id}`}>Consultar y editar →</Link></li>)}</ul>
    {!data.length && <p>Todavía no hay eventos. Crea el primero como borrador.</p>}</main>;
}
