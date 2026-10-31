import Link from "next/link";
import { notFound } from "next/navigation";
import { publicCompetition } from "@/lib/public-competition";
import { DrawReveal } from "@/components/draw-reveal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export default async function RevealPage({
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
        <h1>{d.event.name}</h1>
        {d.league?.state && d.league.state !== "preview" ? (
          <DrawReveal
            key={d.league.seed}
            matches={d.matches
              .filter((m) => m.order < 1000000)
              .map(({ id, phase, homeName, awayName }) => ({
                id,
                phase,
                homeName,
                awayName,
              }))}
          />
        ) : (
          <section className="admin-surface live-panel">
            <h2>El calendario todavía no está confirmado</h2>
            <p>
              La revisión del sorteo permanece privada hasta que el propietario
              la confirme.
            </p>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
