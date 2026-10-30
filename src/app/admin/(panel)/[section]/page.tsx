import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/owner";
import { LeagueView } from "@/components/league-view";
import type { League } from "@/lib/league/types";
export default async function Competition({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ evento?: string }>;
}) {
  const client = await requireOwner();
  const { section } = await params;
  if (!["calendario", "resultados", "clasificacion"].includes(section))
    notFound();
  const { data: events, error } = await client
    .from("cfp_events")
    .select("id,name")
    .order("starts_at");
  if (error) throw new Error("No se pudieron cargar los eventos");
  const { evento } = await searchParams;
  const event = events?.find((e) => e.id === evento) ?? events?.[0];
  if (!event)
    return (
      <main className="admin-empty">
        <h2>Primero crea un evento</h2>
        <p>
          Después de aprobar a los participantes y cerrar las inscripciones
          podrás preparar la liguilla.
        </p>
        <Link className="action-link" href="/admin/eventos/nuevo">
          Crear borrador
        </Link>
      </main>
    );
  const { data, error: err } = await client.rpc("cfp_league_read", {
    e: event.id,
    admin: true,
  });
  if (err) throw new Error("No se pudo cargar la competición");
  return (
    <main>
      <LeagueView
        eventId={event.id}
        data={data as League}
        admin
        tab={
          section === "clasificacion"
            ? "standings"
            : section === "resultados"
              ? "results"
              : "calendar"
        }
      />
    </main>
  );
}
