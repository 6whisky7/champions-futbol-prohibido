"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <main className="management-page page-width"><h1>No pudimos cargar el panel</h1><p>Comprueba tu conexión y vuelve a intentarlo.</p><button className="trophy-button" onClick={reset}>Volver a intentar</button><a href="/admin/acceso">Ir al acceso</a></main>;
}
