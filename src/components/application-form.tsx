"use client";
import { useState } from "react";
import Image from "next/image";
import { crests } from "@/lib/crests";
import { submitApplication } from "@/app/eventos/actions";
import type { ApplicationPayload } from "@/lib/applications";
export function ApplicationForm({
  eventId,
  reserved,
  initial,
  onSave,
}: {
  eventId: string;
  reserved: string[];
  initial?: ApplicationPayload;
  onSave?: (p: ApplicationPayload) => Promise<string>;
}) {
  const [p, setP] = useState<ApplicationPayload>(
    initial ?? {
      name: "",
      crest: "",
      number: "",
      captain: "0",
      members: Array.from({ length: 3 }, () => ({ roblox: "", tiktok: "" })),
    },
  );
  const [key] = useState(() => crypto.randomUUID());
  const [review, setReview] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<{
    id: string;
    state: string;
    expires_at: string | null;
  }>();
  function field(k: keyof ApplicationPayload, v: string) {
    setP({ ...p, [k]: v });
    setReview(false);
  }
  async function send() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (onSave) {
        const outcome = await onSave(p);
        if (outcome === "Guardado.") setNotice(outcome);
        else setError(outcome);
      } else {
        const r = await submitApplication(eventId, p, key, waiting);
        if (r.error) setError(r.error);
        else setResult(r.result);
      }
    } catch {
      setError(
        "No se pudo enviar. Conservamos tus datos. Reintenta con esta misma página.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <section className="registration-lock" role="status">
        <h2>
          {result.state === "waiting"
            ? "Solicitud en lista de espera"
            : "Solicitud recibida: pendiente de revisión"}
        </h2>
        <p>Referencia: {result.id}</p>
        {result.expires_at && (
          <p>
            Vence:{" "}
            {new Date(result.expires_at).toLocaleString("es-CR", {
              timeZone: "America/Costa_Rica",
            })}{" "}
            · Costa Rica.
          </p>
        )}
        <p>
          {result.state === "waiting"
            ? "No reserva plaza, nombre, jugadores ni escudo. El organizador podrá promoverla si hay disponibilidad."
            : "El capitán debe contactar a @whiskyzc desde el perfil de TikTok declarado para confirmar su inscripción antes del vencimiento. Enviar la solicitud todavía no significa estar aprobado."}
        </p>
      </section>
    );
  return (
    <form
      className="event-form application-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (review) void send();
        else setReview(true);
      }}
    >
      <fieldset>
        <legend>Identidad del equipo</legend>
        <label htmlFor="team-name">Nombre del equipo</label>
        <input
          id="team-name"
          required
          minLength={3}
          maxLength={60}
          value={p.name}
          onChange={(e) => field("name", e.target.value)}
        />
        <label htmlFor="team-number">
          Número opcional · 01–99, puede repetirse
        </label>
        <input
          id="team-number"
          inputMode="numeric"
          pattern="0[1-9]|[1-9][0-9]"
          maxLength={2}
          value={p.number}
          onChange={(e) => field("number", e.target.value)}
        />
        <label htmlFor="crest">Escudo</label>
        <select
          id="crest"
          required
          value={p.crest}
          onChange={(e) => field("crest", e.target.value)}
        >
          <option value="">Elige un diseño</option>
          {crests.map((c) => (
            <option
              key={c.id}
              value={c.id}
              disabled={!onSave && !waiting && reserved.includes(c.id)}
            >
              Diseño {c.id} · {c.club}
              {reserved.includes(c.id) ? " · Reservado" : ""}
            </option>
          ))}
        </select>
        {p.crest && (
          <Image
            className="application-crest"
            src={crests.find((c) => c.id === p.crest)?.src ?? ""}
            alt={`Diseño ${p.crest}`}
            width={100}
            height={100}
          />
        )}
        <p>Se reserva al guardar correctamente, no al seleccionarlo.</p>
      </fieldset>
      <fieldset>
        <legend>Plantilla</legend>
        <p>
          Tres titulares y un suplente opcional. Usa los nombres de usuario, no
          los nombres visibles.
        </p>
        {p.members.map((m, i) => (
          <div className="member-fields" key={i}>
            <h3>{i === 3 ? "Suplente" : "Titular " + (i + 1)}</h3>
            {(["roblox", "tiktok"] as const).map((k) => (
              <div key={k}>
                <label htmlFor={`${k}-${i}`}>
                  {k === "roblox"
                    ? "Usuario de Roblox"
                    : "Usuario de TikTok (privado)"}
                </label>
                <input
                  id={`${k}-${i}`}
                  required
                  maxLength={k === "roblox" ? 20 : 24}
                  value={m[k]}
                  onChange={(e) => {
                    setReview(false);
                    setP({
                      ...p,
                      members: p.members.map((v, j) =>
                        j === i ? { ...v, [k]: e.target.value } : v,
                      ),
                    });
                  }}
                />
              </div>
            ))}
          </div>
        ))}
        <button
          className="trophy-button"
          type="button"
          onClick={() => {
            setReview(false);
            setP({
              ...p,
              members:
                p.members.length === 3
                  ? [...p.members, { roblox: "", tiktok: "" }]
                  : p.members.slice(0, 3),
            });
          }}
        >
          {p.members.length === 3 ? "Añadir suplente" : "Quitar suplente"}
        </button>
        <label htmlFor="captain">Capitán</label>
        <select
          id="captain"
          value={p.captain}
          onChange={(e) => field("captain", e.target.value)}
        >
          {p.members.slice(0, 3).map((m, i) => (
            <option key={i} value={i}>
              Titular {i + 1}
              {m.roblox ? ` · ${m.roblox}` : ""}
            </option>
          ))}
        </select>
      </fieldset>
      {!onSave && (
        <fieldset>
          <legend>Antes de enviar</legend>
          <p>
            Cada integrante debe seguir a @whiskyzc, estar en{" "}
            <a
              href="https://tiktok.me/group/ZSgLCxnLr/"
              target="_blank"
              rel="noreferrer"
            >
              La Chapizza
            </a>{" "}
            y tener aceptada la amistad con SOYWHYSKY en Roblox. El
            administrador lo revisa manualmente. Ver el LIVE, comentar y dar tap
            tap es voluntario.
          </p>
          <label>
            <input type="checkbox" required /> He informado a mi plantilla y
            entiendo los requisitos y la publicación de los usuarios de Roblox.
          </label>
          <label>
            <input
              type="checkbox"
              checked={waiting}
              onChange={(e) => {
                setWaiting(e.target.checked);
                setReview(false);
              }}
            />{" "}
            Enviar a lista de espera, sin reservas
          </label>
        </fieldset>
      )}
      {review && (
        <section className="registration-lock">
          <h2>Revisa tu solicitud</h2>
          <p>
            {p.name} · Escudo {p.crest}
            {p.number ? ` · Nº ${p.number}` : ""}
          </p>
          <ul>
            {p.members.map((m, i) => (
              <li key={i}>
                {m.roblox} · TikTok: {m.tiktok}
                {String(i) === p.captain ? " · Capitán" : ""}
                {i === 3 ? " · Suplente" : ""}
              </li>
            ))}
          </ul>
          <p>
            {waiting
              ? "Lista de espera sin reservas."
              : "Pendiente de confirmación y revisión."}
          </p>
        </section>
      )}
      <p role="status">{notice}</p>
      <p role="alert">{error}</p>
      <button className="action-link" disabled={busy}>
        {busy
          ? "Guardando…"
          : review
            ? onSave
              ? "Guardar corrección"
              : "Enviar solicitud"
            : "Revisar datos"}
      </button>
    </form>
  );
}
