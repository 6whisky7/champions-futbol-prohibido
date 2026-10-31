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
export async function setRequirement(id:string,member_index:number,requirement:string,checked:boolean,reason:string){
  const c=await requireOwner();
  const {error}=await c.rpc("cfp_set_requirement",{aid:id,member_index,requirement,checked,reason});
  if(error)return error.message;
  revalidatePath("/admin/solicitudes");revalidatePath("/admin");
  return "Comprobación guardada.";
}
