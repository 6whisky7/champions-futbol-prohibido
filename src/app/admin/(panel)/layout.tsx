import { Suspense } from "react";
import { requireOwner } from "@/lib/owner";
import { eventColumns, type TournamentEvent } from "@/lib/events";
import { AdminShell } from "@/components/admin-shell";
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await requireOwner();
  const { data, error } = await client
    .from("cfp_events")
    .select(eventColumns)
    .order("starts_at");
  if (error) throw new Error("No se pudieron cargar los eventos.");
  return (
    <Suspense fallback={<p>Cargando administración…</p>}>
      <AdminShell events={data as TournamentEvent[]}>{children}</AdminShell>
    </Suspense>
  );
}
