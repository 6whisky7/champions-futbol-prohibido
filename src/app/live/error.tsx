"use client";
import Link from "next/link";
export default function LiveError({ retry }: { retry: () => void }) {
  return (
    <main className="management-page page-width">
      <h1>No pudimos consultar LIVE</h1>
      <p>Revisa la conexión o vuelve a comprobar tu acceso.</p>
      <div className="admin-tabs">
        <button className="action-link" onClick={retry}>
          Volver a intentar
        </button>
        <Link href="/live/acceso">Ir al acceso LIVE</Link>
      </div>
    </main>
  );
}
