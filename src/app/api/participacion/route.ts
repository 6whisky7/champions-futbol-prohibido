import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const client = await createClient();
  const policy = await client.rpc("cfp_registration_status");
  if (policy.error)
    return Response.json(
      { error: "No se pudo consultar la disponibilidad." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  if (!policy.data?.enabled || !policy.data?.version)
    return Response.json(
      { events: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  const { data, error } = await client
    .from("cfp_events")
    .select("id,name,capacity,registration_status")
    .eq("status", "published")
    .order("starts_at");
  if (error)
    return Response.json(
      { error: "No se pudo consultar la disponibilidad." },
      { status: 503 },
    );
  const events = await Promise.all(
    (data ?? [])
      .filter((e) => e.registration_status === "open")
      .map(async (e) => {
        const result = await client.rpc("cfp_public_teams", { e: e.id });
        return {
          id: e.id,
          name: e.name,
          free: result.error
            ? null
            : Math.max(0, e.capacity - (result.data?.length ?? 0)),
        };
      }),
  );
  return Response.json(
    { events },
    { headers: { "Cache-Control": "no-store" } },
  );
}
