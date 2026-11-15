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
  if(value.registration_status==="open") {
    const {data:policy,error:policyError}=await client.rpc("cfp_registration_status");
    if(policyError || !policy?.enabled) return {message:"Antes de abrir, confirma el aviso de privacidad, la conservación y la participación de menores."};
  }
  const id = String(form.get("id") ?? "");
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return { message: "Evento inválido." };
  if (id) {
    const existing = await client.from("cfp_events").select("is_test").eq("id", id).maybeSingle();
    if (existing.error || !existing.data) return { message: "No se pudo consultar la clasificación actual del evento; no guardamos cambios." };
    if (existing.data.is_test === null) delete (value as Partial<typeof value>).is_test;
  }
  const query = id
    ? client.from("cfp_events").update(value).eq("id", id).eq("updated_at", String(form.get("updated_at") ?? ""))
    : client.from("cfp_events").insert(value);
  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) return { message: "No se pudo guardar. Revisa los datos o recarga: el evento pudo cambiar en otra pestaña." };
  revalidatePath("/eventos"); revalidatePath(`/eventos/${data.id}`); revalidatePath("/admin");
  redirect(`/admin/eventos/${data.id}?guardado=1`);
}

export async function runEventLifecycle(eventId: string, action: "cancel" | "finish" | "restore", reason: string) {
  const client = await requireOwner();
  if (!/^[0-9a-f-]{36}$/i.test(eventId) || !["cancel", "finish", "restore"].includes(action)) return { ok: false, message: "Evento o acción inválidos." };
  if (reason.trim().length < 3 || reason.trim().length > 1000) return { ok: false, message: "Indica un motivo de 3–1000 caracteres." };
  const { error } = await client.rpc("cfp_event_lifecycle", { p_event: eventId, p_action: action, p_reason: reason.trim() });
  if (error) return { ok: false, message: error.message || "No se pudo cambiar el estado. Recarga y revisa el evento." };
  revalidatePath("/admin"); revalidatePath("/admin/eventos"); revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/eventos"); revalidatePath(`/eventos/${eventId}`);
  return { ok: true, message: "Estado del evento actualizado." };
}

export async function seedTestApplications(eventId: string, count: number) {
  const client = await requireOwner();
  if (!/^[0-9a-f-]{36}$/i.test(eventId) || !Number.isInteger(count) || count < 1 || count > 64) return { ok: false, message: "Indica entre 1 y 64 equipos ficticios." };
  const { data, error } = await client.rpc("cfp_test_seed_applications", { p_event: eventId, p_count: count });
  if (error) return { ok: false, message: error.message || "No se pudieron crear los datos ficticios." };
  revalidatePath(`/admin/eventos/${eventId}`); revalidatePath("/admin/solicitudes"); revalidatePath("/admin");
  return { ok: true, message: `Se crearon ${data?.created ?? count} solicitudes ficticias. Revisa aprobaciones y lista de espera desde el panel.` };
}
