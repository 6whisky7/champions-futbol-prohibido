"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/owner";
import { revalidatePath } from "next/cache";
import type { LiveDocument } from "@/lib/live";
const uuid = (v: string) => /^[a-f0-9-]{36}$/i.test(v);
export async function saveLive(
  e: string,
  mid: string,
  action: string,
  p: Record<string, unknown>,
  expected: number,
) {
  if (
    !uuid(e) ||
    !uuid(mid) ||
    !["score", "call", "reset"].includes(action) ||
    !p ||
    JSON.stringify(p).length > 4000
  )
    return { error: "Operación inválida." };
  const c = await createClient(),
    auth = await c.auth.getUser();
  if (auth.error || !auth.data.user)
    return { error: "Tu sesión terminó. Vuelve al acceso LIVE." };
  const { error } = await c.rpc("cfp_live_save", {
    e,
    mid,
    action,
    p,
    expected,
  });
  if (error) return { error: error.message };
  const { data, error: readError } = await c.rpc("cfp_live_read", { e });
  return readError
    ? {
        error:
          "La operación se guardó, pero no pudimos volver a consultar. Actualiza antes de repetir.",
      }
    : { data: data as LiveDocument };
}
export async function saveLiveOfficial(
  e: string,
  mid: string,
  kind: string,
  absent: string | null,
  expected: number,
  working_expected: number,
  reason: string,
  confirmed: boolean,
) {
  const c = await requireOwner();
  if (
    confirmed !== true ||
    !uuid(e) ||
    !uuid(mid) ||
    !["sport", "absence"].includes(kind) ||
    reason.trim().length < 3
  )
    return {
      error: "Revisa equipo, motivo y confirmación del resultado oficial.",
    };
  const { error } = await c.rpc("cfp_live_official", {
    e,
    mid,
    kind,
    absent,
    expected,
    working_expected,
    reason,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/eventos", "layout");
  const { data, error: readError } = await c.rpc("cfp_live_read", { e });
  return readError
    ? {
        error:
          "Se guardó la resolución oficial. Actualiza para comprobarla antes de repetir.",
      }
    : { data: data as LiveDocument };
}
export async function changeLiveHelper(
  e: string,
  email: string,
  active: boolean,
  reason: string,
) {
  const c = await requireOwner();
  if (
    !uuid(e) ||
    email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    typeof active !== "boolean"
  )
    return "Revisa evento y correo de la cuenta verificada.";
  const { error } = await c.rpc("cfp_live_helper", {
    e,
    email: email.trim().toLowerCase(),
    active,
    reason,
  });
  revalidatePath("/admin/live");
  return (
    error?.message ??
    "Permiso actualizado. No se envió invitación ni se creó una cuenta."
  );
}
export async function changeLiveEvidence(
  e: string,
  mid: string,
  raw: string,
  public_flag: boolean,
  reason: string,
) {
  const c = await requireOwner();
  let url: string | null = null;
  if (
    !uuid(e) ||
    !uuid(mid) ||
    typeof public_flag !== "boolean" ||
    raw.length > 2000 ||
    /\s/.test(raw) ||
    Array.from(raw).some(
      (ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127,
    )
  )
    return "Revisa el enlace HTTPS y la visibilidad.";
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
      url = u.href;
    } catch {
      return "Usa un enlace HTTPS válido, sin credenciales.";
    }
  }
  const { error } = await c.rpc("cfp_live_evidence", {
    e,
    mid,
    url,
    public_flag,
    reason,
  });
  revalidatePath("/admin/live");
  revalidatePath(`/eventos/${e}/partidos/${mid}`);
  return (
    error?.message ??
    (url
      ? "Enlace guardado con la visibilidad indicada."
      : "Enlace retirado; su historial se conserva.")
  );
}
export async function requestLiveAccess(
  _state: { message: string },
  form: FormData,
) {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))
    return { message: "Escribe un correo válido." };
  const c = await createClient();
  await c.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo:
        "https://champions-futbol-prohibido.vercel.app/auth/callback",
    },
  });
  return {
    message:
      "Si la cuenta ya está registrada, recibirás un enlace. Ábrelo en este mismo navegador. El permiso por evento lo asigna el propietario.",
  };
}
export async function signOutLive() {
  const c = await createClient();
  const { error } = await c.auth.signOut();
  if (error) throw Error("No se pudo cerrar la sesión. Reintenta.");
  redirect("/live/acceso");
}
