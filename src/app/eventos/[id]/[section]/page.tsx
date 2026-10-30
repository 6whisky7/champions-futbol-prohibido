import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueView } from "@/components/league-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { League } from "@/lib/league/types";
export const dynamic = "force-dynamic";
export default async function PublicCompetition({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !["calendario", "resultados", "clasificacion"].includes(section)
  )
    notFound();
  const c = await createClient();
  const { data: ev, error } = await c
    .from("cfp_events")
    .select("id,name")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("No se pudo consultar el evento");
  if (!ev) notFound();
  const { data, error: err } = await c.rpc("cfp_league_read", {
    e: id,
    admin: false,
  });
  if (err) throw new Error("No se pudo cargar la liguilla");
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <Link href={`/eventos/${id}`}>Volver al evento</Link>
        <h1>{ev.name}</h1>
        <nav className="admin-tabs">
          {["calendario", "resultados", "clasificacion"].map((s) => (
            <Link
              key={s}
              aria-current={section === s ? "page" : undefined}
              href={`/eventos/${id}/${s}`}
            >
              {s === "clasificacion"
                ? "Clasificación"
                : s === "calendario"
                  ? "Calendario"
                  : "Resultados"}
            </Link>
          ))}
        </nav>
        <LeagueView
          eventId={id}
          data={data as League | null}
          tab={
            section === "clasificacion"
              ? "standings"
              : section === "resultados"
                ? "results"
                : "calendar"
          }
        />
      </main>
      <SiteFooter />
    </>
  );
}
