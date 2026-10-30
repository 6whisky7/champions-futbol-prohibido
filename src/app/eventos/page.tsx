import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { eventDate, eventFormats, eventColumns, type TournamentEvent } from "@/lib/events";
export const dynamic = "force-dynamic";
export const metadata = { title: "Eventos | Champions Fútbol Prohibido" };
export default async function Events() {
  const client = await createClient();
  const { data, error } = await client.from("cfp_events").select(eventColumns).eq("status", "published").order("starts_at");
  return <><SiteHeader /><main className="management-page page-width"><h1>Eventos del torneo</h1><p>Consulta las fechas, el cupo y el formato. Las inscripciones todavía no están disponibles.</p>
    {error ? <p role="alert">No pudimos cargar los eventos. Vuelve a intentarlo en unos minutos.</p> : !data?.length ? <p>Todavía no hay eventos publicados. Anunciaremos aquí el próximo torneo.</p> : <ul className="event-list">{(data as TournamentEvent[]).map(e => <li key={e.id}><h2><Link href={`/eventos/${e.id}`}>{e.name}</Link></h2><p>{eventDate(e.starts_at)} · {eventFormats[e.format].label} · {e.capacity} equipos</p><p>Inscripciones cerradas</p><Link href={`/eventos/${e.id}`}>Consultar evento →</Link></li>)}</ul>}</main><SiteFooter /></>;
}
