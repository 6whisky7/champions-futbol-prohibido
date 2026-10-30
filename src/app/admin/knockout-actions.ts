"use server";
import { requireOwner } from "@/lib/owner";
import { revalidatePath } from "next/cache";
export async function knockoutAction(
  eventId: string,
  action: string,
  p: Record<string, unknown>,
  revision: number,
) {
  const c = await requireOwner();
  const { error } =
    action === "preview"
      ? await c.rpc("cfp_knockout_preview", { e: eventId })
      : await c.rpc("cfp_knockout_action", {
          e: eventId,
          action,
          p,
          expected: revision,
        });
  if (error) return error.message;
  revalidatePath("/admin", "layout");
  revalidatePath("/eventos", "layout");
  return "Guardado.";
}
