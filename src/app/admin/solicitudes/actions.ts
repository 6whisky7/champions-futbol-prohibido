"use server";
import { requireOwner } from "@/lib/owner";
import { revalidatePath } from "next/cache";
import type { ApplicationPayload } from "@/lib/applications";
export async function reviewApplication(
  id: string,
  decision: string,
  reason: string,
  p: ApplicationPayload | null = null,
) {
  const client = await requireOwner();
  const { error } = await client.rpc("cfp_review_application", {
    aid: id,
    decision,
    reason,
    p,
  });
  if (error) return error.message;
  revalidatePath("/admin/solicitudes");
  revalidatePath("/eventos", "layout");
  return "Guardado.";
}
