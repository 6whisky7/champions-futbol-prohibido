"use server";
import type { Knockout } from "@/lib/knockout";
import { unresolved } from "@/lib/public-matches";
import { requireOwner } from "@/lib/owner";
import { revalidatePath } from "next/cache";
export async function knockoutAction(
  eventId: string,
  action: string,
  p: Record<string, unknown>,
  revision: number,
) {
  const c = await requireOwner();
  const score = action === "score";
  if (score) {
    const { data, error } = await c.rpc("cfp_knockout_read", { e: eventId, admin: true });
    const current = data as Knockout | null;
    const match = current?.matches.find((m) => m.id === p.id);
    if (error || !match || current?.revision !== revision) return "El partido cambió. Revisa el cuadro antes de guardar.";
    const { hg, ag } = p;
    if (typeof hg !== "number" || typeof ag !== "number" ||
      ![hg, ag].every((n) => Number.isInteger(n) && n >= 0 && n <= 2147483647) ||
      hg === ag || Math.abs(hg - ag) > 4)
      return "Debe haber un ganador. La diferencia máxima es de cuatro goles.";
    p = { id: match.id, kind: "sport", hg, ag, scheduled_at: match.scheduled_at,
      reason: unresolved(match.kind) ? "Registro deportivo de un partido pendiente." : String(p.reason ?? "").trim() };
    if (String(p.reason).length < 3 || String(p.reason).length > 1000)
      return "Escribe un motivo de 3 a 1000 caracteres.";
  }
  const { error } =
    action === "preview"
      ? await c.rpc("cfp_knockout_preview", { e: eventId })
      : await c.rpc("cfp_knockout_action", {
          e: eventId,
          action: score ? "match" : action,
          p,
          expected: revision,
        });
  if (error) return error.message;
  revalidatePath("/admin", "layout");
  revalidatePath("/eventos", "layout");
  if (score) {
    const { data, error } = await c.rpc("cfp_knockout_read", { e: eventId, admin: true });
    const saved = data as Knockout | null;
    const match = saved?.matches.find((m) => m.id === p.id);
    if (error || !saved || saved.revision !== revision + 1 || !match?.winner ||
        match.kind !== "sport" || match.hg !== p.hg || match.ag !== p.ag)
      return "No se pudo confirmar el resultado. Revisa el cuadro antes de volver a guardar.";
    return "Resultado guardado correctamente";
  }
  return "Guardado.";
}
