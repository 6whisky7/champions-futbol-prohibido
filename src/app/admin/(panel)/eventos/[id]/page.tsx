import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/owner";
import { EventForm } from "@/components/event-form";
import { EventLifecycleActions, TestSeedForm } from "@/components/event-lifecycle-actions";
import { eventStatusTerminal } from "@/lib/events";
import { eventColumns, type TournamentEvent } from "@/lib/events";
export default async function EditEvent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  const client = await requireOwner();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data, error } = await client
    .from("cfp_events")
    .select(eventColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo consultar el evento.");
  if (!data) notFound();
  return (
    <main className="admin-editor">
      <Link href="/admin/eventos">← Eventos</Link>
      {(await searchParams).guardado && <p role="status">Evento guardado.</p>}
      {data.status === "published" && !data.is_test && (
        <Link href={`/eventos/${id}`}>Ver página pública →</Link>
      )}
      {data.is_test && <p className="admin-note"><strong>PRUEBA</strong> · El evento está aislado de listados y proyecciones públicas.</p>}
      {eventStatusTerminal(data.status as TournamentEvent["status"]) ? (
        <p className="admin-note">Este evento es terminal. Su configuración queda protegida; utiliza las acciones de estado si la restauración está permitida.</p>
      ) : (
        <EventForm key={id} event={data as TournamentEvent} />
      )}
      {data.is_test && !eventStatusTerminal(data.status as TournamentEvent["status"]) && <TestSeedForm eventId={id} />}
      <EventLifecycleActions event={data as TournamentEvent} />
    </main>
  );
}
