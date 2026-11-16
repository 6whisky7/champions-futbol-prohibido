import { KnockoutView } from "@/components/knockout-view";
import { LeagueTable } from "@/components/league-table";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicEventFilter } from "@/lib/events";
import type { League } from "@/lib/league/types";
import type { Knockout } from "@/lib/knockout";
import { unresolved } from "@/lib/public-matches";
import { LeagueView } from "@/components/league-view";
import { PublicEventNavigation } from "@/components/public-event-navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

export default async function PublicCompetition({ params }: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id) ||
      !["calendario", "resultados", "clasificacion", "eliminatorias"].includes(section)) notFound();
  const client = await createClient();
  const { data: event, error } = await client.from("cfp_events").select("id,name").or(publicEventFilter)
    .eq("id", id).in("status", ["published", "finished"]).maybeSingle();
  if (error) throw new Error("No se pudo consultar el evento.");
  if (!event) notFound();

  const isKnockout = section === "eliminatorias";
  const competition = await client.rpc(isKnockout ? "cfp_knockout_read" : "cfp_league_read", { e: id, admin: false });
  if (competition.error) throw new Error("No se pudo consultar la competición.");
  const league = isKnockout ? null : competition.data as League | null;
  const knockout = isKnockout ? competition.data as Knockout | null : null;
  const played = league?.matches.filter((match) => !unresolved(match.kind)).length ?? 0;

  return (
    <>
      <SiteHeader />
      <main className="management-page page-width public-event-detail public-competition">
        <h1>{event.name}</h1>
        <PublicEventNavigation eventId={id} current={section} />
        {section === "eliminatorias" ? (
          <KnockoutView eventId={id} data={knockout} />
        ) : section === "clasificacion" ? (
          league?.state && played ? (
            <LeagueTable data={league} played={played} eventId={id} />
          ) : (
            <section className="public-event-empty" aria-labelledby="standings-empty-title">
              <h2 id="standings-empty-title">Clasificación</h2>
              <p>La tabla aparecerá con los primeros resultados de la liguilla.</p>
            </section>
          )
        ) : (
          <LeagueView eventId={id} data={league} tab={section === "resultados" ? "results" : "calendar"} />
        )}
        {(league || knockout) && (
          <details className="public-event-tools">
            <summary>Más del torneo</summary>
            <Link href={"/eventos/" + id + "/exportar"}>Exportar tabla y resultados</Link>
            <Link href={"/eventos/" + id + "/revelacion"}>Ver sorteo del calendario</Link>
          </details>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
