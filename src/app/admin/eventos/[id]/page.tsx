import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/owner";
import { EventForm } from "@/components/event-form";
import { eventColumns, type TournamentEvent } from "@/lib/events";
export default async function EditEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ guardado?: string }> }) {
  const client = await requireOwner();const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data, error } = await client.from("cfp_events").select(eventColumns).eq("id", id).maybeSingle();
  if (error) throw new Error("No se pudo consultar el evento.");
  if (!data) notFound();
  return <main className="management-page page-width"><Link href="/admin">← Eventos</Link><h1>Editar evento</h1>{(await searchParams).guardado && <p role="status">Evento guardado.</p>}{data.status === "published" && <Link href={`/eventos/${id}`}>Ver página pública →</Link>}<EventForm event={data as TournamentEvent} /></main>;
}
