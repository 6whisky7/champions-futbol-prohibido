import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { eventDate, eventFormats, eventColumns, type TournamentEvent } from "@/lib/events";
export const dynamic = "force-dynamic";
export const metadata = { title: "Eventos | Champions Fútbol Prohibido" };
export default async function Events({ searchParams }: { searchParams: Promise<{inscripciones?: string}> }) {
  const onlyOpen = (await searchParams).inscripciones === "abiertas";
  const client = await createClient();
  const { data, error } = await client.from("cfp_events").select(eventColumns).eq("status", "published").order("starts_at");
  const events = ((data ?? []) as TournamentEvent[]).filter(e => !onlyOpen || e.registration_status === "open");
  const places = new Map(await Promise.all(events.filter(e=>e.registration_status==="open").map(async e=>{
    const r=await client.rpc("cfp_public_teams",{e:e.id});
    return [e.id,r.error?null:Math.max(0,e.capacity-(r.data?.length??0))] as const;
  })));
  return <><SiteHeader /><main className="management-page page-width"><h1>{onlyOpen ? "Elige dónde participar" : "Eventos del torneo"}</h1><nav className="admin-tabs" aria-label="Filtrar eventos"><Link href="/eventos" aria-current={!onlyOpen ? "page" : undefined}>Todos</Link><Link href="/eventos?inscripciones=abiertas" aria-current={onlyOpen ? "page" : undefined}>Inscripciones abiertas</Link></nav><p>Consulta las fechas, el cupo y el formato. Cada evento indica si permite inscripciones.</p>
    {error ? <p role="alert">No pudimos cargar los eventos. Vuelve a intentarlo en unos minutos.</p> : !events.length ? <div><p>Todavía no hay eventos disponibles en esta selección.</p><p><a href="https://www.tiktok.com/@whiskyzc" target="_blank" rel="noopener noreferrer">Convocatorias en TikTok</a> · <a href="https://tiktok.me/group/ZSgLCxnLr/" target="_blank" rel="noopener noreferrer">La Chapizza</a></p></div> : <ul className="event-list">{events.map(e => <li key={e.id}><h2><Link href={`/eventos/${e.id}`}>{e.name}</Link></h2><p>{eventDate(e.starts_at)} · {eventFormats[e.format].label} · {e.capacity} equipos</p><p>Inscripciones {e.registration_status === "open" ? "abiertas" : "cerradas"}{e.registration_status === "open" && places.get(e.id) != null ? places.get(e.id) === 0 ? " · Cupo lleno; lista de espera disponible" : ` · ${places.get(e.id)} plazas disponibles (las pendientes ocupan plaza)` : ""}</p><Link href={`/eventos/${e.id}${e.registration_status === "open" ? "#inscripcion" : ""}`}>{e.registration_status === "open" ? places.get(e.id) === 0 ? "Apuntarme a la lista de espera →" : "Inscribir mi equipo →" : "Consultar evento →"}</Link></li>)}</ul>}</main><SiteFooter /></>;
}
