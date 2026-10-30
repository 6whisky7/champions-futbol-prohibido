"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/owner";
import { parseEvent } from "@/lib/events";

export async function requestAccess(_state: { message: string }, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const owner = process.env.CFP_OWNER_EMAIL?.trim().toLowerCase();
  if (!owner) return { message: "El acceso del propietario está pendiente de configuración." };
  if (email !== owner) return { message: "Si el correo corresponde al propietario, recibirás un enlace de acceso." };
  const client = await createClient();
  const { error } = await client.auth.signInWithOtp({ email, options: {
    shouldCreateUser: true,
    emailRedirectTo: "https://champions-futbol-prohibido.vercel.app/auth/callback",
  } });
  return { message: error ? "No se pudo enviar el enlace. Espera un minuto e inténtalo de nuevo." : "Revisa tu correo. Abre el enlace en este mismo navegador para entrar." };
}
export async function signOut() {
  const client = await createClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error("No se pudo cerrar la sesión. Inténtalo de nuevo.");
  redirect("/admin/acceso");
}
export async function saveEvent(_state: { message: string }, form: FormData) {
  const client = await requireOwner();
  let value;
  try { value = parseEvent(form); } catch (error) { return { message: error instanceof Error ? error.message : "Revisa los campos." }; }
  const id = String(form.get("id") ?? "");
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return { message: "Evento inválido." };
  const query = id
    ? client.from("cfp_events").update(value).eq("id", id).eq("updated_at", String(form.get("updated_at") ?? ""))
    : client.from("cfp_events").insert(value);
  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) return { message: "No se pudo guardar. Revisa los datos o recarga: el evento pudo cambiar en otra pestaña." };
  revalidatePath("/eventos"); revalidatePath(`/eventos/${data.id}`); revalidatePath("/admin");
  redirect(`/admin/eventos/${data.id}?guardado=1`);
}
