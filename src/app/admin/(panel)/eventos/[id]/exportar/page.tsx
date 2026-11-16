import Link from "next/link";
import { notFound } from "next/navigation";
import { CompetitionExport } from "@/components/competition-export";
import { requireOwner } from "@/lib/owner";
import type { Knockout } from "@/lib/knockout";
import type { League } from "@/lib/league/types";
import { publicMatches } from "@/lib/public-matches";

export default async function TestEventExport({ params }: { params: Promise<{ id: string }> }) {
  const client = await requireOwner();
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();

  const { data: event, error } = await client.from("cfp_events")
    .select("id,name").eq("id", id).eq("is_test", true).maybeSingle();
  if (error) throw new Error("No se pudo consultar el ensayo.");
  if (!event) notFound();

  const [leagueRead, knockoutRead] = await Promise.all([
    client.rpc("cfp_league_read", { e: id, admin: true }),
    client.rpc("cfp_knockout_read", { e: id, admin: true }),
  ]);
  if (leagueRead.error || knockoutRead.error) throw new Error("No se pudo preparar la exportación.");
  const league = leagueRead.data as League | null;
  const knockout = knockoutRead.data as Knockout | null;

  return (
    <main className="admin-surface">
      <Link href={"/admin/eventos/" + id}>← Volver al ensayo</Link>
      <h1>Exportar el ensayo</h1>
      <p>Competición privada de prueba. Exporta el calendario, la clasificación y los resultados.</p>
      <CompetitionExport
        event={event}
        league={league?.state && league.state !== "preview"
          ? { state: league.state, table: league.table, format: league.format, qualified: league.qualified }
          : null}
        matches={publicMatches(league, knockout)}
      />
    </main>
  );
}
