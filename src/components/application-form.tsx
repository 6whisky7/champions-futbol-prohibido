"use client";
import { useState } from "react";
import Image from "next/image";
import { crests } from "@/lib/crests";
import { submitApplication } from "@/app/eventos/actions";
import type { ApplicationPayload, Member } from "@/lib/applications";
export function ApplicationForm({
  eventId,
  reserved,
  initial,
  initialCrest = '',
  onSave,
  defaultWaiting = false,
  privacyVersion = null,
}: {
  eventId: string;
  defaultWaiting?: boolean;
  privacyVersion?: string | null;
  reserved: string[];
  initial?: ApplicationPayload;
  initialCrest?: string;
  onSave?: (p: ApplicationPayload) => Promise<string>;
}) {
  const [p, setP] = useState<ApplicationPayload>(
    initial ?? {
      name: "",
      crest: initialCrest,
      captain: "0",
      members: Array.from({ length: 3 }, () => ({ roblox: "", tiktok: "" })),
    },
  );
  const [key] = useState(() => crypto.randomUUID());
  const [review, setReview] = useState(false);
  const [waiting, setWaiting] = useState(defaultWaiting);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<{
    id: string;
    state: string;
    expires_at: string | null;
  }>();
  const selectedCrest = crests.find((crest) => crest.id === p.crest);
  function field(k: "name" | "crest" | "captain", v: string) {
    setP((value) => ({ ...value, [k]: v }));
    setReview(false);
  }
  function memberField(index: number, key: keyof Member, value: string) {
    setReview(false);
    setP((previous) => ({
      ...previous,
      members: previous.members.map((member, i) => i === index ? { ...member, [key]: value } : member),
    }));
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
        const r = await submitApplication(eventId, p, key, waiting, privacyVersion ? {version:privacyVersion,accepted:privacyAccepted} : undefined);
        if (r.error) setError(r.error);
        else if (r.result) setResult(r.result);
        else setError("No se pudo confirmar el envío. Conserva tus datos y reintenta.");
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
            ? "La espera no reserva plaza, escudo ni jugadores."
            : "El capitán debe escribir a @whiskyzc desde el TikTok declarado antes del vencimiento. El equipo queda pendiente de aprobación."}
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
        <div className="application-crest-picker">
          <div>
            <label htmlFor="crest">Escudo</label>
            <select id="crest" required value={p.crest} onChange={(e) => field("crest", e.target.value)}>
              <option value="">Elige un escudo</option>
              {crests.map((c) => (
                <option key={c.id} value={c.id} disabled={!onSave && !waiting && reserved.includes(c.id)}>
                  {c.club}{reserved.includes(c.id) ? " · Reservado" : ""}
                </option>
              ))}
            </select>
          </div>
          {selectedCrest && (
            <div className="application-crest-preview">
              <Image src={selectedCrest.src} alt={"Escudo de " + selectedCrest.club} width={72} height={72} />
            </div>
          )}
        </div>
        <p>El escudo se reserva al guardar una solicitud con plaza.</p>
      </fieldset>
      <fieldset>
        <legend>Plantilla</legend>
        <p>
          Añade tres titulares y, si quieres, un suplente. Escribe sus nombres de usuario.
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
                  onChange={(e) => memberField(i, k, e.target.value)}
                />
              </div>
            ))}
            <div className="player-number">
              <label htmlFor={"player-number-" + i}>Número del jugador (opcional)</label>
              <input id={"player-number-" + i} inputMode="numeric" placeholder="01–99"
                pattern="0[1-9]|[1-9][0-9]" maxLength={2} value={m.number ?? ""}
                aria-describedby="player-number-help" onChange={(e) => memberField(i, "number", e.target.value)} />
            </div>
          </div>
        ))}
        <p id="player-number-help">Del 01 al 99. Puede repetirse entre jugadores.</p>
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
            y tener aceptada la amistad con SOYWHYSKY en Roblox.
          </p>
          <label>
            <input type="checkbox" required /> He revisado la plantilla, los requisitos y la publicación de los nombres de Roblox.
          </label>
          <label>
            <input
              type="checkbox"
              checked={waiting}
              onChange={(e) => {
                setWaiting(e.target.checked);
                if (!e.target.checked && reserved.includes(p.crest)) field("crest", "");
                setReview(false);
              }}
            />{" "}
            Enviar a lista de espera, sin reservas
          </label>
        </fieldset>
      )}
      {review && (
        <section className="registration-lock">
          <h2>{onSave ? "Revisa la corrección" : "Revisa tu solicitud"}</h2>
          <p>
            {p.name}{selectedCrest && " · " + selectedCrest.club}
          </p>
          <ul>
            {p.members.map((m, i) => (
              <li key={i}>
                {m.roblox} · TikTok: {m.tiktok}
                {String(i) === p.captain ? " · Capitán" : ""}
                {i === 3 ? " · Suplente" : ""}
                {m.number && " · Nº " + m.number}
              </li>
            ))}
          </ul>
          {!onSave && <p>{waiting ? "Lista de espera sin reservas." : "Pendiente de confirmación y revisión."}</p>}
        </section>
      )}
      {!onSave && <section className="registration-lock">
        <p>Whisky usa estos datos para organizar el torneo. Equipo, escudo y Roblox pueden publicarse. TikTok y el número del jugador quedan privados. <a href="/privacidad" target="_blank" rel="noopener noreferrer">Aviso de privacidad</a>.</p>
        {privacyVersion ? <label><input type="checkbox" checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)} required /> He leído el aviso de privacidad presentado (versión {privacyVersion}).</label> : <p>Falta completar el aviso definitivo y el procedimiento de autorización de los integrantes y menores. El envío todavía no está habilitado.</p>}
        <p>La aceptación registra la decisión de quien envía. El organizador debe verificar por separado la autorización de cada integrante.</p>
      </section>}
      <p role="status">{notice}</p>
      <p role="alert">{error}</p>
      <button className="action-link" disabled={busy || (!onSave && (!privacyVersion || !privacyAccepted))}>
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
