"use client";
import type { Application } from "@/lib/applications";
const keys = [
  { key: "follow", label: "Seguimiento" },
  { key: "group", label: "La Chapizza" },
  { key: "friend", label: "Amistad Roblox" },
] as const;
export function RequirementChecks({
  application: a,
  disabled,
  save,
}: {
  application: Application;
  disabled: boolean;
  save: (member: number, key: string, checked: boolean) => void;
}) {
  const detailed = a.member_checks?.length === a.payload.members.length;
  const completed = (a.member_checks ?? []).reduce(
      (sum, m) => sum + keys.filter((k) => m[k.key] === true).length,
      0,
    ),
    total = a.payload.members.length * 3;
  const players = (a.member_checks ?? []).filter((m) =>
    keys.every((k) => m[k.key] === true),
  ).length;
  return (
    <section className="requirement-checks">
      <h4>Revisión por integrante</h4>
      {detailed && (
        <p>
          <strong>
            {players} de {a.payload.members.length} jugadores con sus 3
            requisitos revisados.
          </strong>
        </p>
      )}
      <p>
        {detailed || !a.requirements_checked
          ? `${completed} de ${total} comprobaciones; ${a.payload.members.length} jugadores × 3 requisitos.`
          : "Revisión global anterior registrada; no hay desglose individual. Se conserva la aprobación existente."}
      </p>
      <p>
        La confirmación del capitán es una comprobación adicional del equipo:{" "}
        <strong>{a.captain_confirmed ? "Confirmada" : "Pendiente"}</strong>.
      </p>
      {!detailed && a.requirements_checked && a.state !== "pending" ? (
        <p>
          Los controles individuales se registrarán en nuevas revisiones; no se
          inventa un historial retroactivo.
        </p>
      ) : (
        a.payload.members.map((m, i) => (
          <fieldset key={m.roblox}>
            <legend>
              {m.roblox} · {i === 3 ? "Suplente" : "Titular"}
              {String(i) === a.payload.captain ? " · Capitán" : ""}
            </legend>
            <div className="requirement-grid">
              {keys.map((k) => {
                const done = a.member_checks?.[i]?.[k.key] === true;
                return (
                  <label
                    key={k.key}
                    className={
                      done ? "requirement-done" : "requirement-pending"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={disabled || a.state !== "pending"}
                      onChange={(e) => save(i, k.key, e.target.checked)}
                    />
                    <span>
                      {k.label}
                      <small>{done ? "Revisado" : "Pendiente"}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))
      )}
      {a.state === "pending" && (
        <p className="admin-note">
          Añade el motivo de revisión para guardar cada cambio. «Marcar
          requisitos revisados» declara que verificaste las {total}{" "}
          comprobaciones de toda la plantilla; no es una aprobación por
          excepción.
        </p>
      )}
    </section>
  );
}
