import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicCompetition } from "@/lib/public-competition";
import { unresolved } from "@/lib/public-matches";
import { getCrest } from "@/lib/crests";
import { NextMatch } from "@/components/next-match";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
type Props = { params: Promise<{ id: string; match: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, match: idMatch } = await params,
    d = await publicCompetition(id),
    m = d?.matches.find((x) => x.id === idMatch);
  if (!d || !m) return { title: "Partido no disponible" };
  const title = `${m.homeName} contra ${m.awayName} · ${d.event.name}`;
  const finished = !unresolved(m.kind);
  return {
    title,
    description: m.phase,
    openGraph: {
      title,
      description: m.phase,
      images: finished
        ? [
            {
              url: `/eventos/${id}/partidos/${m.id}/imagen`,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: finished ? [`/eventos/${id}/partidos/${m.id}/imagen`] : [],
    },
  };
}
export default async function MatchPage({ params }: Props) {
  const { id, match: matchId } = await params,
    d = await publicCompetition(id),
    m = d?.matches.find((x) => x.id === matchId);
  if (!d || !m) notFound();
  const client = await createClient(),
    { data: evidence, error: evidenceError } = await client.rpc(
      "cfp_public_evidence",
      { e: id },
    );
  const clip = !evidenceError
    ? (evidence as { match_id: string; url: string }[] | null)?.find(
        (x) => x.match_id === m.id,
      )
    : null;
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <Link href={`/eventos/${id}/resultados`}>Volver a resultados</Link>
        <p className="eyebrow">
          {d.event.name} · {m.phase}
        </p>
        <h1>Detalle del partido</h1>
        <section className="admin-surface public-score">
          <div>
            {m.homeCrest && (
              <Image
                src={getCrest(m.homeCrest).src}
                alt=""
                width={96}
                height={96}
              />
            )}
            <h2>{m.homeName}</h2>
          </div>
          <strong>
            {unresolved(m.kind)
              ? "Por jugar"
              : m.hg === null || m.ag === null
                ? "Sin goles asignados"
                : `${m.hg} – ${m.ag}`}
          </strong>
          <div>
            {m.awayCrest && (
              <Image
                src={getCrest(m.awayCrest).src}
                alt=""
                width={96}
                height={96}
              />
            )}
            <h2>{m.awayName}</h2>
          </div>
        </section>
        <p>
          {unresolved(m.kind)
            ? "Pendiente de resolución oficial"
            : m.kind === "sport"
              ? "Resultado deportivo oficial"
              : "Resolución administrativa. No cuenta como récord deportivo."}
        </p>
        {clip && (
          <p>
            <a href={clip.url} target="_blank" rel="noopener noreferrer">
              Ver clip de evidencia publicado por el organizador
            </a>
          </p>
        )}
        {unresolved(m.kind) ? (
          <NextMatch eventId={id} match={m} />
        ) : (
          <section className="admin-surface">
            <h2>Comparte el resultado</h2>
            <p>
              La tarjeta incluye únicamente los datos públicos de este partido.
              Comparte el enlace de esta página para consultar siempre la
              resolución vigente.
            </p>
            <a
              className="action-link"
              href={`/eventos/${id}/partidos/${m.id}/imagen?vertical=1`}
              download
            >
              Descargar tarjeta vertical (PNG)
            </a>
            <p className="admin-note">
              Formato 1080 × 1920 para stories y TikTok. Si se corrige un
              resultado, vuelve a descargar la tarjeta.
            </p>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
