import Link from "next/link";
import { notFound } from "next/navigation";
import { publicCompetition } from "@/lib/public-competition";
import { CompetitionExport } from "@/components/competition-export";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    d = await publicCompetition(id);
  if (!d) notFound();
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <Link href={`/eventos/${id}`}>Volver al evento</Link>
        <h1>Exportar la edición</h1>
        <p>
          Clasificación y resultados de {d.event.name}. La imagen corresponde a
          la página elegida; el PDF y CSV incluyen todas.
        </p>
        <CompetitionExport
          event={{ id: d.event.id, name: d.event.name }}
          league={
            d.league?.state
              ? {
                  state: d.league.state,
                  table: d.league.table,
                  format: d.league.format,
                  qualified: d.league.qualified,
                }
              : null
          }
          matches={d.matches}
        />
      </main>
      <SiteFooter />
    </>
  );
}
