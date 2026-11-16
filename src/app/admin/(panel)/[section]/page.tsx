import { SelectAdminEvent } from "@/components/select-admin-event";
import { KnockoutView } from "@/components/knockout-view";
import type { Knockout } from "@/lib/knockout";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/owner";
import { LeagueView } from "@/components/league-view";
import { knockoutMatchChoices } from "@/lib/admin-match-choices";
import type { LiveDocument } from "@/lib/live";
import type { League } from "@/lib/league/types";
export default async function Competition({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ evento?: string; partido?: string }>;
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
  const { evento, partido } = await searchParams;
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
    const knockout = ko as Knockout | null;
    const selected = knockout?.matches.find((match) => match.id === partido)?.id;
    return (
      <main>
        <KnockoutView key={event.id + ":" + (selected ?? "")} eventId={event.id} data={knockout} format={event.format} initialMatch={selected} admin />
      </main>
    );
  }
  if (err) throw new Error("No se pudo cargar la competición");
  const hasPicker = section === "calendario" && (league?.state === "active" || league?.state === "closed");
  const [pickerBracket, live] = await Promise.all([
    hasPicker && league?.state === "closed" ? client.rpc("cfp_knockout_read", { e: event.id, admin: true }) : null,
    hasPicker ? client.rpc("cfp_live_read", { e: event.id }) : null,
  ]);
  if (pickerBracket?.error) throw new Error("No se pudieron cargar los partidos de eliminatorias");
  const liveMatches = ((live?.data as LiveDocument | null)?.matches ?? [])
    .filter(({ active, working }) => active && working?.called_at && !working.needs_reset &&
      ((working.hg ?? 0) > 0 || (working.ag ?? 0) > 0))
    .map(({ id }) => id);
  return (
    <main>
      <LeagueView
        key={event.id + ":" + section}
        eventId={event.id}
        data={league}
        bracketChoices={knockoutMatchChoices((pickerBracket?.data as Knockout | null) ?? null)}
        liveMatches={liveMatches}
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
