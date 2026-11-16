import { SelectAdminEvent } from "@/components/select-admin-event";
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
    .select("id,name,format")
    .order("starts_at");
  if (error) throw new Error("No se pudieron cargar los eventos");
  const { evento } = await searchParams;
  const event = events?.find((e) => e.id === evento);
  if (!event) return <main><SelectAdminEvent invalid={Boolean(evento)} /></main>;
  const { data, error: err } = await client.rpc("cfp_league_read", { e: event.id, admin: true });
  const league = data as League | null;
  if (section === "eliminatorias") {
    if (err) throw new Error("No se pudo cargar la competición");
    if (league?.state !== "closed") return (
      <main className="admin-empty">
        <h2>Cierra primero la liguilla</h2>
        <p>Confirma la clasificación final antes de preparar las eliminatorias.</p>
        <Link className="action-link" href={"/admin/clasificacion?evento=" + event.id}>Ver clasificación</Link>
      </main>
    );
    const { data: ko, error } = await client.rpc("cfp_knockout_read", { e: event.id, admin: true });
    if (error) throw new Error("No se pudo cargar el cuadro");
    return (
      <main>
        <KnockoutView key={event.id} eventId={event.id} data={ko as Knockout | null} format={event.format} admin />
      </main>
    );
  }
  if (err) throw new Error("No se pudo cargar la competición");
  return (
    <main>
      <LeagueView
        key={event.id + ":" + section}
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
      {section === "resultados" && league?.state === "closed" && (
        <Link href={"/admin/eliminatorias?evento=" + event.id}>Ver resultados de eliminatorias</Link>
      )}
    </main>
  );
}
