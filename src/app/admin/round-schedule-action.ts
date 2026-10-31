"use server";
import { requireOwner } from "@/lib/owner";
import { revalidatePath } from "next/cache";
import type { League } from "@/lib/league/types";
import { unresolved } from "@/lib/public-matches";
export async function saveRoundSchedule(
  e: string,
  round: number,
  rows: { id: string; date: string }[],
  expected: number,
  reason: string,
) {
  const c = await requireOwner();
  const saved: string[] = [],
    unchanged: string[] = [];
  const fail = (error: string) => ({ saved, unchanged, error });
  if (
    !/^[a-f0-9-]{36}$/i.test(e) ||
    !Number.isInteger(round) ||
    round < 1 ||
    round > 8 ||
    !Array.isArray(rows) ||
    !rows.length ||
    rows.length > 48 ||
    !Number.isInteger(expected) ||
    typeof reason !== "string" ||
    reason.trim().length < 3 ||
    reason.length > 900 ||
    rows.some(
      (r) =>
        !r ||
        typeof r.id !== "string" ||
        !/^[a-f0-9-]{36}$/i.test(r.id) ||
        typeof r.date !== "string" ||
        r.date.length > 40 ||
        !Number.isFinite(Date.parse(r.date)),
    )
  )
    return fail("Revisa jornada, fechas y motivo.");
  const read = await c.rpc("cfp_league_read", { e, admin: true }),
    l = read.data as League | null;
  if (read.error || !l || l.state !== "active")
    return fail("La liguilla no permite guardar fechas. Revisa su estado.");
  if (l.revision !== expected)
    return fail(
      "La competición cambió. Revisa lo guardado y prepara otra revisión.",
    );
  const matches = l.matches.filter(
    (m) => m.round === round && unresolved(m.kind),
  );
  if (
    rows.length !== matches.length ||
    new Set(rows.map((r) => r.id)).size !== rows.length ||
    rows.some((r) => !matches.some((m) => m.id === r.id))
  )
    return fail("Los partidos de la jornada cambiaron. Recarga y revisa.");
  try {
    for (const row of rows) {
      const m = matches.find((m) => m.id === row.id)!;
      if (
        m.scheduled_at &&
        Date.parse(m.scheduled_at) === Date.parse(row.date)
      ) {
        unchanged.push(row.id);
        continue;
      }
      // Reuse the existing serialized operation and revision guard. No new scheduling bypass.
      const r = await c.rpc("cfp_league_action", {
        e,
        action: "match",
        p: {
          id: m.id,
          kind: m.kind,
          hg: m.hg,
          ag: m.ag,
          scheduled_at: new Date(row.date).toISOString(),
          reason: `Horario de jornada ${round} · ${reason.trim()}`,
        },
        expected: expected + saved.length,
      });
      if (r.error)
        return fail(
          r.error.message +
            " Revisa los horarios ya guardados antes de reintentar.",
        );
      saved.push(row.id);
    }
    return { saved, unchanged, error: null };
  } catch {
    return fail(
      "No pudimos confirmar el siguiente guardado. Comprueba el calendario antes de repetir.",
    );
  } finally {
    if (saved.length) {
      revalidatePath("/admin", "layout");
      revalidatePath("/eventos", "layout");
    }
  }
}
