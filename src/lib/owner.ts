import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireOwner() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/admin/acceso");
  const { data: owner, error: permissionError } = await client.rpc("cfp_is_owner");
  if (permissionError || owner !== true) redirect("/admin/acceso?estado=sin-permiso");
  return client;
}
