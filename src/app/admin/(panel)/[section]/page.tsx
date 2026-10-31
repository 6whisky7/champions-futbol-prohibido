import { KnockoutView } from "@/components/knockout-view";
import type { Knockout } from "@/lib/knockout";
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
  if (
    !["calendario", "resultados", "clasificacion", "eliminatorias"].includes(
      section,
    )
  )
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
        <h2>{section === "eliminatorias" ? "Todavía no hay cuadro de eliminatorias" : "Primero crea un evento"}</h2>
        <p>
          {section === "eliminatorias" ? "El cuadro se prepara después de cerrar la clasificación de liguilla. Primero crea el evento y completa esa fase." : "Crea un evento como borrador. Después de aprobar a los participantes y cerrar las inscripciones podrás preparar la liguilla."}
        </p>
        <Link className="action-link" href="/admin/eventos/nuevo">
          Crear evento
        </Link>
      </main>
    );
  const { data: ko, error: koError } = await client.rpc("cfp_knockout_read", {
    e: event.id,
    admin: true,
  });
  if (koError) throw new Error("No se pudo cargar el cuadro");
  if (section === "eliminatorias")
    return (
      <main>
        <KnockoutView eventId={event.id} data={ko as Knockout | null} admin />
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
      {section !== "clasificacion" && ko && (
        <KnockoutView
          eventId={event.id}
          data={ko as Knockout}
          admin
          mode={section === "resultados" ? "results" : "bracket"}
        />
      )}
    </main>
  );
}
