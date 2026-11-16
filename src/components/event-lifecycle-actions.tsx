"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { runEventLifecycle, seedTestApplications } from "@/app/admin/actions";
import type { TournamentEvent } from "@/lib/events";

export function EventLifecycleActions({ event, only }: { event: TournamentEvent; only: "finish" | "maintenance" }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const actions: ("finish" | "cancel" | "restore")[] = only === "finish"
    ? ["finish"] : event.status === "published" || event.status === "draft"
      ? ["cancel"] : event.status === "cancelled" ? ["restore"] : [];
  const title = "event-lifecycle-title-" + only;
  const input = "lifecycle-reason-" + only;
  const copy = {
    finish: ["Finalizar evento", "Finalizar y conservar el campeón", "Cierra las inscripciones. La base exige un resultado de final confirmado y conserva la competición en el historial público."],
    cancel: ["Cancelar evento", "Cancelar este evento", "Cierra las inscripciones y retira el evento de la web pública. Los resultados e historial se conservan para administración."],
    restore: ["Restaurar a borrador", "Restaurar el evento", "Solo se puede restaurar antes de empezar la competición. Quedará como borrador con las inscripciones cerradas."],
  } as const;
  async function run(action: typeof actions[number]) {
    setBusy(true); setMessage("");
    try {
      const result = await runEventLifecycle(event.id, action, reason);
      setMessage(result.message);
      if (result.ok) { setReason(""); router.refresh(); }
      return result.ok;
    } catch {
      setMessage("No se pudo completar la operación. Revisa tu sesión y vuelve a cargar el evento.");
      return false;
    } finally { setBusy(false); }
  }
  if (!actions.length) return null;
  return (
    <section className="admin-card" id={only === "finish" ? "event-lifecycle" : undefined} aria-labelledby={title}>
      <h2 id={title}>{only === "finish" ? "Finalizar el evento" : "Estado del evento"}</h2>
      <p>Estado actual: <strong>{event.status === "draft" ? "Borrador" : event.status === "published" ? "Publicado" : event.status === "finished" ? "Finalizado" : "Cancelado"}</strong>. Inscripciones {event.registration_status === "open" ? "abiertas" : "cerradas"}.</p>
      <label htmlFor={input}>Motivo administrativo</label>
      <textarea id={input} value={reason} minLength={3} maxLength={1000} onChange={(e) => setReason(e.target.value)} rows={3} />
      <div className="admin-action-row">
        {actions.map((action) => {
          const [label, title, description] = copy[action];
          return <ConfirmAction key={action} label={label} title={title} description={description} busy={busy} disabled={reason.trim().length < 3} message={message} onConfirm={() => run(action)} />;
        })}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}

export function TestSeedForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function seed() {
    setBusy(true); setMessage("");
    try {
      const result = await seedTestApplications(eventId, count);
      setMessage(result.message);
      if (result.ok) router.refresh();
      return result.ok;
    } catch {
      setMessage("No se pudieron crear los datos ficticios. Revisa la conexión y vuelve a consultar el evento antes de repetir.");
      return false;
    } finally { setBusy(false); }
  }
  return (
    <section className="admin-card" aria-labelledby="test-seed-title">
      <h2 id="test-seed-title">Preparar equipos de prueba</h2>
      <p>Genera solicitudes y nombres ficticios para probar aprobación, espera, calendario y resultados. No se admiten estos datos en eventos oficiales. Esta acción solo se permite una vez por evento.</p>
      <label htmlFor="test-team-count">Solicitudes ficticias</label>
      <input id="test-team-count" type="number" min={1} max={64} value={count} onChange={(e) => setCount(Math.max(1, Math.min(64, Number(e.target.value) || 1)))} />
      <ConfirmAction label="Generar datos ficticios" title="Crear solicitudes de prueba" description={`${count} equipos ficticios se cargarán en este evento. La operación no se puede repetir.`} busy={busy} message={message} onConfirm={seed} />
      {message && <p role="status">{message}</p>}
    </section>
  );
}
