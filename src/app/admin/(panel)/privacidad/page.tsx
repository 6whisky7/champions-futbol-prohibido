import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { PrivacyControls } from "@/components/privacy-controls";

export default async function PrivacyAdminPage() {
  const client = await requireOwner();
  const { data, error } = await client.rpc("cfp_privacy_admin_status");
  if (error || !data) throw new Error("No se pudo consultar el estado de privacidad y conservación.");
  return (
    <main className="admin-stack">
      <p className="admin-note">El estado de esta página refleja la configuración guardada en Supabase. Cambiarla no abre inscripciones por sí solo.</p>
      <p><Link href="/privacidad" target="_blank" rel="noreferrer">Revisar el aviso público versión {data.notice_version} →</Link></p>
      <PrivacyControls status={data} />
    </main>
  );
}
