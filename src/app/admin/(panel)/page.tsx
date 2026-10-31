import Link from "next/link";
import { CalendarDays, ArrowRight, Clock3 } from "lucide-react";
import { requireOwner } from "@/lib/owner";
import { eventColumns, eventDate, type TournamentEvent } from "@/lib/events";
import { type Application } from "@/lib/applications";
import { adminNextStep } from "@/lib/admin-next-step";
import type { League } from "@/lib/league/types";
import type { Knockout } from "@/lib/knockout";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string }>;
}) {
  const client = await requireOwner();
  const { data, error } = await client
    .from("cfp_events")
    .select(eventColumns)
    .order("starts_at");
  if (error) throw new Error("No se pudieron consultar los eventos.");
  const events = data as TournamentEvent[];
  const { evento } = await searchParams;
  const event = events.find((e) => e.id === evento) ?? events[0];
  if (!event)
    return (
      <main className="admin-empty">
        <CalendarDays size={48} />
        <h2>Tu próximo torneo empieza aquí</h2>
        <p>
          Crea el primer evento como borrador. Después podrás preparar su
          formato, abrir inscripciones y revisar a los equipos desde este panel.
        </p>
        <Link className="action-link" href="/admin/eventos/nuevo">
          Crear evento <ArrowRight size={20} />
        </Link>
        <p className="admin-note">
          El borrador es privado y nace con las inscripciones cerradas.
        </p>
      </main>
    );
  const { data: raw, error: failed } = await client.rpc(
    "cfp_admin_applications",
    { e: event.id },
  );
  if (failed) throw new Error("No se pudieron consultar las solicitudes.");
  const items = raw as Application[];
  const [league,knockout,privacy]=await Promise.all([client.rpc("cfp_league_read",{e:event.id,admin:true}),client.rpc("cfp_knockout_read",{e:event.id,admin:true}),client.rpc("cfp_registration_status")]);
  if(league.error||knockout.error||privacy.error)throw new Error("No se pudo calcular el siguiente paso.");
  const pending = items.filter((a) => a.state === "pending"),
    approved = items.filter((a) => a.state === "approved"),
    waiting = items.filter((a) => a.state === "waiting");
  const next=adminNextStep(event,league.data as League|null,knockout.data as Knockout|null,pending.length,approved.length,privacy.data?.enabled===true);
  const near = pending.filter(
    (a) =>
      a.expires_at &&
      new Date(a.expires_at).getTime() - new Date().getTime() <= 6 * 3600000,
  );
  const history = items
    .flatMap((a) =>
      a.history.map((h) => ({ ...h, name: a.payload.name, id: a.id })),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);
  const labels: Record<string, string> = {
    pending: "Solicitud recibida",
    waiting: "Ingreso a espera",
    approve: "Equipo aprobado",
    confirm: "Capitán confirmado",
    requirements: "Requisitos revisados",
    reject: "Solicitud rechazada",
    correct: "Datos corregidos",
    promote: "Promoción a pendiente",
    expired: "Plazo vencido",
  };
  const review = (id?: string, view = "pending") =>
    `/admin/solicitudes?evento=${event.id}&vista=${view}${id ? "&solicitud=" + id + "#application-detail" : ""}`;
  return (
    <main className="admin-overview">
      <section className="admin-event-banner">
        <div>
          <h2>{event.name}</h2>
          <p>
            {eventDate(event.starts_at)} · {event.capacity} plazas
          </p>
        </div>
        <Link href={`/admin/eventos/${event.id}`}>Configurar evento →</Link>
      </section>
      <section className="admin-surface admin-next-step"><h2>Siguiente paso</h2><h3>{next.title}</h3><p>{next.text}</p><Link className="action-link" href={next.href}>{next.action} <ArrowRight size={20}/></Link></section>
      <dl className="admin-counts">
        {[
          ["Plazas ocupadas", pending.length + approved.length],
          [
            "Disponibles",
            Math.max(0, event.capacity - pending.length - approved.length),
          ],
          ["Pendientes", pending.length],
          ["Aprobados", approved.length],
          ["En espera", waiting.length],
        ].map(([label, n]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{n}</dd>
          </div>
        ))}
      </dl>
      <p className="admin-note">
        Pendientes y aprobados ocupan plaza. La lista de espera no reserva cupo,
        escudo ni jugadores.
      </p>
      <div className="admin-summary-grid">
        <section className="admin-surface">
          <h2>
            <Clock3 size={24} /> Requieren tu atención
          </h2>
          {pending.length ? (
            <>
              <p>
                {pending.length} {pending.length===1?"solicitud espera":"solicitudes esperan"} confirmación o revisión.
              </p>
              <Link className="action-link" href={review()}>
                Revisar solicitudes →
              </Link>
              <h3>Próximas a vencer · en 6 horas</h3>
              {near.length ? (
                <ul className="admin-activity">
                  {near.map((a) => (
                    <li key={a.id}>
                      <Link href={review(a.id)}>{a.payload.name}</Link>
                      <span>{a.expires_at && eventDate(a.expires_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay solicitudes que venzan en las próximas 6 horas.</p>
              )}
            </>
          ) : (
            <p>
              No tienes solicitudes pendientes. Las nuevas solicitudes
              aparecerán aquí.
            </p>
          )}
          {waiting.length > 0 && (
            <Link href={review(undefined, "waiting")}>
              Consultar {waiting.length} solicitudes en espera →
            </Link>
          )}
        </section>
        <section className="admin-surface">
          <h2>Actividad reciente</h2>
          {history.length ? (
            <ul className="admin-activity">
              {history.map((h, i) => (
                <li key={i}>
                  <Link href={review(h.id, "")}>{h.name}</Link>
                  <span>{labels[h.action] ?? h.action}</span>
                  <time>{eventDate(h.at)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              El historial aparecerá cuando recibas solicitudes o registres una
              revisión.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
