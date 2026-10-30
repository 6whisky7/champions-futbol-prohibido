"use server";
import { requireOwner } from "@/lib/owner";
import { revalidatePath } from "next/cache";
export async function leagueAction(
  eventId: string,
  action: string,
  p: Record<string, unknown>,
  revision: number,
) {
  const c = await requireOwner();
  if (["preview", "regenerate", "confirm"].includes(action)) {
    const { data, error } = await c.rpc("cfp_league_read", {
      e: eventId,
      admin: true,
    });
    if (error || !data?.readiness?.ready)
      return (
        data?.readiness?.reasons?.join(" ") ??
        "No se pudo comprobar la preparación del evento."
      );
  }
  const result =
    action === "preview"
      ? await c.rpc("cfp_league_preview", { e: eventId })
      : await c.rpc("cfp_league_action", {
          e: eventId,
          action,
          p,
          expected: revision,
        });
  if (result.error) return result.error.message;
  revalidatePath("/admin", "layout");
  revalidatePath("/eventos", "layout");
  return "Guardado.";
}
