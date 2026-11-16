import Link from "next/link";

export function SelectAdminEvent({ invalid }: { invalid?: boolean }) {
  return (
    <section className="admin-empty">
      <h2>{invalid ? "No encontramos ese evento" : "Selecciona un evento"}</h2>
      <p>{invalid ? "Elige un evento válido del listado para continuar." : "Elige el torneo que quieres administrar."}</p>
      <Link className="action-link" href="/admin/eventos">Ver eventos</Link>
    </section>
  );
}
