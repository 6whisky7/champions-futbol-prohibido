import { SelectAdminEvent } from "@/components/select-admin-event";
import { requireOwner } from "@/lib/owner";
import { ApplicationManager } from "@/components/application-manager";
import type { Application } from "@/lib/applications";
export const dynamic = "force-dynamic";
export default async function Applications({
  searchParams,
}: {
  searchParams: Promise<{
    evento?: string;
    vista?: string;
    solicitud?: string;
  }>;
}) {
  const client = await requireOwner();
  const { data: events, error } = await client
    .from("cfp_events")
    .select("id,name,capacity,registration_status,roster_locked")
    .order("starts_at");
  if (error) throw new Error("No se pudieron cargar los eventos.");
  const { evento, vista, solicitud } = await searchParams;
  const event = events?.find((e) => e.id === evento);
  if (!event) return <main><SelectAdminEvent invalid={Boolean(evento)} /></main>;
  const result = await client.rpc("cfp_admin_applications", { e: event.id });
  if (result.error) throw new Error("No se pudieron cargar las solicitudes.");
  return (
    <main className="admin-requests">
      <ApplicationManager
        initialFilter={vista ?? "pending"}
        initialSelected={solicitud}
        key={event.id + (vista ?? "pending") + (solicitud ?? "")}
        eventId={event.id}
        capacity={event.capacity}
        locked={event.roster_locked}
        open={event.registration_status === "open"}
        items={result.data as Application[]}
      />
    </main>
  );
}
