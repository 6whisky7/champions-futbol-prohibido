"use server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/owner";

const errorText = "No se pudo completar la operación. Revisa tu sesión y vuelve a consultar el estado antes de repetirla.";

export async function savePrivacySettings(input: {
  noticeActive: boolean;
  minorsConfirmed: boolean;
  noticeReviewed: boolean;
  retentionConfirmed: boolean;
  reason: string;
}) {
  const client = await requireOwner();
  if (input.reason.trim().length < 3 || input.reason.trim().length > 1000) return { ok: false, message: "Indica un motivo de 3–1000 caracteres." };
  if (input.noticeActive && (!input.minorsConfirmed || !input.noticeReviewed || !input.retentionConfirmed)) return { ok: false, message: "Para activar el aviso, confirma las tres condiciones que aparecen en pantalla." };
  const { data, error } = await client.rpc("cfp_privacy_admin_set", {
    p_notice_active: input.noticeActive,
    p_minors_confirmed: input.minorsConfirmed,
    p_notice_reviewed: input.noticeReviewed,
    p_retention_confirmed: input.retentionConfirmed,
    p_reason: input.reason.trim(),
  });
  if (error || !data?.saved) return { ok: false, message: error?.message || errorText };
  revalidatePath("/admin/privacidad"); revalidatePath("/privacidad"); revalidatePath("/eventos");
  return { ok: true, message: data.changed ? "Configuración de privacidad guardada." : "Estado confirmado y guardado." };
}

export async function previewRetention() {
  const client = await requireOwner();
  const { data, error } = await client.rpc("cfp_retention_preview");
  if (error || !data) return { ok: false, message: error?.message || errorText, preview: null };
  return { ok: true, message: "Vista previa actualizada. No se modificaron solicitudes.", preview: data };
}

export async function runRetention() {
  const client = await requireOwner();
  const { data, error } = await client.rpc("cfp_retention_run", { p_confirm: true });
  if (error || !data) return { ok: false, message: error?.message || errorText, result: null };
  revalidatePath("/admin/privacidad"); revalidatePath("/admin/solicitudes"); revalidatePath("/eventos");
  return { ok: true, message: `Conservación ejecutada: ${data.anonymized} solicitudes anonimizadas.`, result: data };
}
