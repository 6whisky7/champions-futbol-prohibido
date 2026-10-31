"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeLiveHelper, changeLiveEvidence } from "@/app/live/actions";
import type { LiveAdmin, LiveMatch } from "@/lib/live";
export function LiveOwnerTools({
  eventId,
  admin,
  match,
}: {
  eventId: string;
  admin: LiveAdmin;
  match: LiveMatch | null;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [reason, setReason] = useState("");
  const router = useRouter();
  async function run(fn: () => Promise<string>) {
    setBusy(true);
    try {
      setMessage(await fn());
      router.refresh();
    } catch {
      setMessage(
        "No se pudo guardar. Conserva tus datos y actualiza para comprobar el estado.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section
        id="live-helpers"
        tabIndex={-1}
        className="admin-surface live-owner-tools"
      >
        <h2>Ayudantes del evento</h2>
        <p>
          Solo editan el marcador de trabajo de este evento publicado. No pueden
          convocar, guardar resultados oficiales, revisar solicitudes ni acceder
          a TikTok o notas.
        </p>
        <form
          className="event-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run(() =>
              changeLiveHelper(eventId, String(f.get("email")), true, reason),
            );
          }}
        >
          <label htmlFor="helper-email">Correo de la cuenta verificada</label>
          <input
            id="helper-email"
            name="email"
            type="email"
            autoComplete="off"
            maxLength={254}
            required
          />
          <label htmlFor="helper-reason">
            Motivo de asignación o revocación (privado)
          </label>
          <input
            id="helper-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={3}
            maxLength={1000}
            required
          />
          <button
            className="action-link"
            disabled={busy || reason.trim().length < 3}
          >
            Asignar ayudante a este evento
          </button>
        </form>
        <p className="admin-note">
          La cuenta debe existir y tener correo verificado. No se envían
          invitaciones ni se crean cuentas. Acceso del ayudante: /live/acceso.
        </p>
        <ul className="public-match-list">
          {admin.helpers.map((h) => (
            <li key={h.user_id}>
              <div>
                <strong>{h.email}</strong>
                <p>
                  {h.active
                    ? "Permiso activo · solo marcador de trabajo"
                    : "Permiso revocado"}
                </p>
              </div>
              {h.active && (
                <button
                  className="trophy-button"
                  disabled={busy || reason.trim().length < 3}
                  onClick={() =>
                    void run(() =>
                      changeLiveHelper(eventId, h.email, false, reason),
                    )
                  }
                >
                  Revocar permiso
                </button>
              )}
            </li>
          ))}
        </ul>
        {!admin.helpers.length && (
          <p>
            No hay ayudantes asignados. El propietario conserva todos los
            controles.
          </p>
        )}
        <p role="status">{message}</p>
      </section>
      {match && (
        <EvidenceForm
          key={match.id}
          eventId={eventId}
          match={match}
          initial={admin.evidence.find((x) => x.match_id === match.id)}
        />
      )}
      <details className="admin-surface live-owner-tools">
        <summary>Historial privado de LIVE y permisos</summary>
        <button className="trophy-button" onClick={() => router.refresh()}>
          Actualizar historial privado
        </button>
        <p>
          Se muestran las últimas {admin.history.length} acciones de{" "}
          {admin.history_total}. El historial completo se conserva en la base.
        </p>
        <ul className="admin-activity">
          {admin.history.map((h, i) => (
            <li key={i}>
              <strong>
                {(
                  {
                    score: "Marcador de trabajo",
                    call: "Convocatoria con sala disponible",
                    reset: "Reinicio de trabajo y espera",
                    official_change: "Partido oficial modificado",
                    official_sport: "Resultado deportivo confirmado",
                    official_absence: "Ausencia oficial confirmada",
                    grant_helper: "Ayudante asignado",
                    revoke_helper: "Permiso revocado",
                    evidence: "Visibilidad o enlace de evidencia",
                  } as Record<string, string>
                )[h.action] ?? "Acción registrada"}
              </strong>
              <p>
                {new Date(Date.parse(h.at) - 6 * 3600000)
                  .toISOString()
                  .slice(0, 16)
                  .replace("T", " ")}{" "}
                · Costa Rica
              </p>
              <p>{h.reason}</p>
              <details>
                <summary>Quién realizó la acción</summary>
                <p>
                  {admin.helpers.find((x) => x.user_id === h.actor)?.email ??
                    h.actor ??
                    "Sistema"}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
function EvidenceForm({
  eventId,
  match,
  initial,
}: {
  eventId: string;
  match: LiveMatch;
  initial?: LiveAdmin["evidence"][number];
}) {
  const [url, setUrl] = useState(initial?.url ?? ""),
    [visible, setVisible] = useState(initial?.public_flag ?? false),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <section
      id="live-evidence"
      tabIndex={-1}
      className="admin-surface live-owner-tools"
    >
      <h2>Clip de evidencia</h2>
      <p>
        {match.home_name ?? "Por definir"} contra{" "}
        {match.away_name ?? "Por definir"}. El enlace queda privado salvo que
        marques su publicación. No se descarga ni se incrusta el vídeo.
      </p>
      <form
        className="event-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            setMessage(
              await changeLiveEvidence(eventId, match.id, url, visible, reason),
            );
            router.refresh();
          } catch {
            setMessage("No se pudo guardar. Conservamos los campos.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label htmlFor="evidence-url">Enlace HTTPS (vacío para retirar)</label>
        <input
          id="evidence-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={2000}
        />
        <label className="live-confirm">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
          />{" "}
          Publicar el enlace en la página del partido
        </label>
        <label htmlFor="evidence-reason">Motivo privado</label>
        <input
          id="evidence-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={3}
          maxLength={1000}
          required
        />
        <button
          className="trophy-button"
          disabled={busy || reason.trim().length < 3}
        >
          {url ? "Guardar enlace y visibilidad" : "Retirar enlace"}
        </button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
