import { publishedEvents, publicCompetition } from "@/lib/public-competition";
import { nextPublicMatch } from "@/lib/public-matches";
import { createClient } from "@/lib/supabase/server";
import type { PublicLive } from "@/lib/live";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("evento"),
    headers = { "Cache-Control": "no-store" };
  if (id && !/^[a-f0-9-]{36}$/i.test(id))
    return Response.json(
      { error: "Evento no disponible" },
      { status: 404, headers },
    );
  try {
    const events = await publishedEvents();
    const chosen = id ? events.filter((e) => e.id === id) : events;
    if (id && !chosen.length)
      return Response.json(
        { error: "Evento no disponible" },
        { status: 404, headers },
      );
    // Bound concurrency while reusing the existing explicit public projections.
    const docs = [];
    for (let i = 0; i < chosen.length; i += 4)
      docs.push(
        ...(await Promise.all(
          chosen.slice(i, i + 4).map((e) => publicCompetition(e.id)),
        )),
      );
    const next = docs
      .flatMap((d) => {
        if (!d) return [];
        const match = nextPublicMatch(d.matches);
        return match ? [{ d, match }] : [];
      })
      .sort(
        (a, b) =>
          Date.parse(a.match.scheduled_at!) - Date.parse(b.match.scheduled_at!),
      )[0];
    const d =
      next?.d ??
      docs.find((d) => d?.event.registration_status === "open") ??
      docs[0];
    if (!d)
      return Response.json(
        { event: null, match: null, open: false, free: 0, called: false },
        { headers },
      );
    const c = await createClient(),
      [policy, live] = await Promise.all([
        c.rpc("cfp_registration_status"),
        c.rpc("cfp_live_public", { e: d.event.id }),
      ]);
    if (policy.error || live.error) throw Error("Public read failed");
    const called =
      (live.data as PublicLive | null)?.matches.some(
        (m) =>
          m.active &&
          m.working?.called_at &&
          !m.working.needs_reset &&
          ["pending", "replay", "postponed"].includes(m.kind),
      ) ?? false;
    return Response.json(
      {
        event: { id: d.event.id, name: d.event.name },
        match: next?.match ?? null,
        open:
          d.event.registration_status === "open" &&
          policy.data?.enabled === true &&
          !!policy.data?.version,
        free: Math.max(0, d.event.capacity - d.teams.length),
        called,
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: "No pudimos consultar lo que ocurre ahora." },
      { status: 503, headers },
    );
  }
}
