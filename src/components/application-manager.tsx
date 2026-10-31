"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationForm } from "./application-form";
import Image from "next/image";
import { crests } from "@/lib/crests";
import { type Application, stateLabels } from "@/lib/applications";
import { reviewApplication } from "@/app/admin/solicitudes/actions";
const actionLabels: Record<string, string> = {
  confirm: "Capitán confirmado",
  requirements: "Requisitos revisados",
  approve: "Equipo aprobado",
  reject: "Solicitud rechazada",
  correct: "Datos corregidos",
  promote: "Promoción desde espera",
  pending: "Solicitud recibida",
  waiting: "Ingreso a espera",
  expired: "Plazo vencido",
};
function formatTime(value: string) {
  return (
    new Date(new Date(value).getTime() - 6 * 3600000)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ") + " · Costa Rica"
  );
}
export function ApplicationManager({
  items,
  eventId,
  capacity,
  open,
  locked,
  initialFilter = "pending",
  initialSelected,
}: {
  items: Application[];
  eventId: string;
  capacity: number;
  open: boolean;
  locked: boolean;
  initialFilter?: string;
  initialSelected?: string;
}) {
  const [now] = useState(() => Date.now());
  const [filter, setFilter] = useState(initialFilter),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string | null>(initialSelected ?? null),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false);
  const router = useRouter();
  const pending = items.filter((a) => a.state === "pending").length,
    approved = items.filter((a) => a.state === "approved").length;
  const a = items.find((a) => a.id === selected);
  async function act(decision: string) {
    if (!a) return;
    setBusy(true);
    try {
      setMessage(await reviewApplication(a.id, decision, reason));
      router.refresh();
    } catch {
      setMessage("No se pudo guardar. Reintenta.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <dl className="event-facts application-stats">
        <div>
          <dt>Plazas ocupadas</dt>
          <dd>
            {pending + approved} / {capacity}
          </dd>
        </div>
        <div>
          <dt>Disponibles</dt>
          <dd>{Math.max(0, capacity - pending - approved)}</dd>
        </div>
        <div>
          <dt>Pendientes</dt>
          <dd>{pending}</dd>
        </div>
        <div>
          <dt>Aprobados</dt>
          <dd>{approved}</dd>
        </div>
      </dl>
      <div className="event-form admin-filters">
        <label htmlFor="application-search">Buscar equipo o capitán</label>
        <input
          id="application-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label htmlFor="application-state">Estado</label>
        <select
          id="application-state"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos</option>
          {Object.entries(stateLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <ul className="application-list admin-request-list">
        {items
          .filter(
            (a) =>
              (!filter || filter === a.state) &&
              `${a.payload.name} ${a.payload.members[Number(a.payload.captain)]?.roblox}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((a) => (
            <li key={a.id}>
              <Image
                src={crests.find((c) => c.id === a.payload.crest)?.src ?? ""}
                alt={`Escudo ${a.payload.crest}`}
                width={72}
                height={72}
              />
              <div>
                <h2>{a.payload.name}</h2>
                <p>
                  <span className="admin-state" data-state={a.state}>
                    {stateLabels[a.state]}
                  </span>{" "}
                  · Capitán:{" "}
                  {a.payload.members[Number(a.payload.captain)]?.roblox}
                </p>
                {a.expires_at && a.state === "pending" && (
                  <p>
                    Vence en{" "}
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(a.expires_at).getTime() - now) / 3600000,
                      ),
                    )}{" "}
                    h · {formatTime(a.expires_at)}
                  </p>
                )}
                <button
                  className="trophy-button"
                  onClick={() => {
                    setSelected(a.id);
                    requestAnimationFrame(() => {
                      document.getElementById("detail-title")?.focus();
                      document
                        .getElementById("application-detail")
                        ?.scrollIntoView({
                          behavior: "instant",
                          block: "start",
                        });
                    });
                    setReason("");
                    setMessage("");
                    setEditing(false);
                  }}
                >
                  Revisar {a.payload.name}
                </button>
              </div>
            </li>
          ))}
      </ul>
      {!items.filter(
        (a) =>
          (!filter || a.state === filter) &&
          `${a.payload.name} ${a.payload.members[Number(a.payload.captain)]?.roblox}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ).length && (
        <div className="admin-empty compact">
          <h2>No hay solicitudes para esta vista</h2>
          <p>Cambia el estado o la búsqueda para consultar otros equipos.</p>
        </div>
      )}
      {a && (
        <section className="application-detail" id="application-detail">
          <h2 id="detail-title" tabIndex={-1}>
            Equipo · {a.payload.name}
          </h2>
          <p>
            {stateLabels[a.state]} · Referencia {a.id}
          </p>
          <p className="admin-note">{a.accepted_privacy_version ? `Aviso presentado: ${a.accepted_privacy_version}. Aceptación registrada por quien envió; no acredita el consentimiento de toda la plantilla.` : "Sin aceptación versionada registrada. No se presume consentimiento por una inscripción anterior."}</p>
          <h3>Jugadores</h3>
          <ul className="admin-roster">
            {a.payload.members.map((m, i) => (
              <li key={i}>
                <strong>{m.roblox}</strong> · TikTok: {m.tiktok} ·{" "}
                {i === 3 ? "Suplente" : "Titular"}
                {String(i) === a.payload.captain ? " · Capitán" : ""}
              </li>
            ))}
          </ul>
          <h3>Requisitos</h3>
          {a.state === "pending" && (
            <p className="admin-note">
              Para aprobar: confirma al capitán, revisa los requisitos de toda
              la plantilla y añade el motivo de la decisión.
            </p>
          )}
          <p>
            Capitán:{" "}
            {a.captain_confirmed
              ? "Confirmado"
              : "Por confirmar desde su perfil declarado"}
          </p>
          <p>
            Requisitos:{" "}
            {a.requirements_checked
              ? "Revisados"
              : "Revisar a todos: seguimiento, La Chapizza y amistad con SOYWHYSKY"}
          </p>
          <div className="event-form">
            <label htmlFor="review-reason">
              Motivo o evidencia de la revisión (privado)
            </label>
            <textarea
              id="review-reason"
              value={reason}
              minLength={3}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <p>Rechazar libera la plaza, el nombre, los jugadores y el escudo.</p>
          <div className="admin-tabs">
            {a.state === "pending" && (
              <>
                <button
                  className="trophy-button"
                  disabled={busy || reason.trim().length < 3}
                  onClick={() => void act("confirm")}
                >
                  Confirmar capitán
                </button>
                <button
                  className="trophy-button"
                  disabled={busy || reason.trim().length < 3}
                  onClick={() => void act("requirements")}
                >
                  Marcar requisitos revisados
                </button>
                <button
                  className="action-link"
                  disabled={
                    busy ||
                    reason.trim().length < 3 ||
                    !a.captain_confirmed ||
                    !a.requirements_checked
                  }
                  onClick={() => void act("approve")}
                >
                  Aprobar equipo
                </button>
              </>
            )}
            {a.state === "waiting" && (
              <button
                className="action-link"
                disabled={busy || !open || reason.trim().length < 3}
                onClick={() => void act("promote")}
              >
                Promover y reservar plaza
              </button>
            )}
            {["waiting", "pending", "approved"].includes(a.state) && (
              <>
                <button
                  className="trophy-button"
                  disabled={busy || reason.trim().length < 3}
                  data-action="reject"
                  onClick={() => void act("reject")}
                >
                  Rechazar y liberar reservas
                </button>
                <button
                  className="trophy-button"
                  disabled={!open || locked}
                  onClick={() => setEditing(!editing)}
                >
                  Corregir datos
                </button>
              </>
            )}
          </div>
          <p role="status">{message}</p>
          {!open && (
            <p>
              Inscripciones cerradas: no se permiten promociones ni cambios de
              plantilla.
            </p>
          )}
          {locked && (
            <p>
              La plantilla quedó fijada al cerrar las inscripciones. Reabrir
              permite promociones, pero no corregir plantillas.
            </p>
          )}
          {editing && !locked && (
            <ApplicationForm
              key={a.id}
              eventId={eventId}
              reserved={[]}
              initial={a.payload}
              onSave={async (p) => {
                const message = await reviewApplication(
                  a.id,
                  "correct",
                  reason,
                  p,
                );
                router.refresh();
                return message;
              }}
            />
          )}
          <h3>Historial privado</h3>
          <ul>
            {a.history.map((h, i) => (
              <li key={i}>
                {formatTime(h.at)} · {actionLabels[h.action] ?? h.action} ·{" "}
                {h.reason}
                {h.before_payload && (
                  <details>
                    <summary>Consultar datos anteriores y nuevos</summary>
                    <p>
                      Antes: {h.before_payload.name} · Escudo{" "}
                      {h.before_payload.crest} ·{" "}
                      {h.before_payload.members
                        .map((m) => `${m.roblox} / ${m.tiktok}`)
                        .join(", ")}
                    </p>
                    <p>
                      Después: {h.after_payload?.name} · Escudo{" "}
                      {h.after_payload?.crest} ·{" "}
                      {h.after_payload?.members
                        .map((m) => `${m.roblox} / ${m.tiktok}`)
                        .join(", ")}
                    </p>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
