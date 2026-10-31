"use client";
import Link from "next/link";
export default function AdminError({ retry }: { retry: () => void }) {
  return <main className="management-page page-width"><h1>No pudimos cargar el panel</h1><p>Comprueba tu conexión y vuelve a intentarlo.</p><button className="trophy-button" onClick={retry}>Volver a intentar</button><Link href="/admin/acceso">Ir al acceso</Link></main>;
}
