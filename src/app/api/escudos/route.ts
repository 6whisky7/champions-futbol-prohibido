import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const selected = new URL(request.url).searchParams.get("evento");
  const headers = { "Cache-Control": "no-store" };
  if (selected && !/^[a-f0-9-]{36}$/i.test(selected))
    return Response.json(
      { error: "Evento no disponible." },
      { status: 404, headers },
    );
  const c = await createClient();
  // Explicitly published, including for an owner following a public link.
  const events = await c
    .from("cfp_events")
    .select("id,name,capacity,registration_status")
    .eq("status", "published")
    .order("starts_at");
  if (events.error)
    return Response.json(
      { error: "No pudimos consultar los eventos." },
      { status: 503, headers },
    );
  const options = (events.data ?? []).map(({ id, name }) => ({ id, name }));
  if (!selected)
    return Response.json({ events: options, selected: null }, { headers });
  const e = events.data?.find((e) => e.id === selected);
  if (!e)
    return Response.json(
      { error: "Evento no disponible." },
      { status: 404, headers },
    );
  const [teams, policy] = await Promise.all([
    c.rpc("cfp_public_teams", { e: e.id }),
    c.rpc("cfp_registration_status"),
  ]);
  if (teams.error || policy.error)
    return Response.json(
      { error: "No pudimos consultar la disponibilidad. Reintenta." },
      { status: 503, headers },
    );
  const reserved = [
    ...new Set<string>(
      (teams.data ?? []).map((t: { crest: string }) => t.crest),
    ),
  ];
  return Response.json(
    {
      events: options,
      selected: {
        id: e.id,
        name: e.name,
        reserved,
        free: Math.max(0, e.capacity - (teams.data?.length ?? 0)),
        open:
          e.registration_status === "open" &&
          policy.data?.enabled === true &&
          !!policy.data?.version,
      },
    },
    { headers },
  );
}
