import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { eventDate, eventFormats, eventColumns, type TournamentEvent } from "@/lib/events";
export const dynamic = "force-dynamic";
export default async function PublicEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const client = await createClient();const { data, error } = await client.from("cfp_events").select(eventColumns).eq("id", id).eq("status", "published").maybeSingle();
  if (error) throw new Error("No se pudo cargar el evento. Vuelve a intentarlo.");
  if (!data) notFound();const e = data as TournamentEvent;const format = eventFormats[e.format];
  return <><SiteHeader /><main className="management-page page-width"><Link href="/eventos">← Todos los eventos</Link><h1>{e.name}</h1><p className="event-description">{e.description}</p><dl className="event-facts"><div><dt>Inicio · hora de Costa Rica</dt><dd>{eventDate(e.starts_at)}</dd></div>{e.ends_at && <div><dt>Final previsto</dt><dd>{eventDate(e.ends_at)}</dd></div>}<div><dt>Cupo</dt><dd>{e.capacity} equipos</dd></div><div><dt>Formato</dt><dd>{format.label}</dd></div><div><dt>Liguilla</dt><dd>{format.opponents} rivales distintos por equipo. {e.eliminate_after_league ? `Continúan los ${format.qualified} mejores.` : "Continúan todos los equipos."}</dd></div></dl><p className="registration-lock">Inscripciones cerradas. El formulario de participación todavía no está disponible.</p></main><SiteFooter /></>;
}
