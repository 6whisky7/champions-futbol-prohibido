"use client";
import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { crests } from "@/lib/crests";
import { submitApplication } from "@/app/eventos/actions";
import type { ApplicationPayload, Member } from "@/lib/applications";
import { stateLabels } from "@/lib/applications";
import { validateApplication, usernameError, usernameSuggestion, validReceipt, uncertainMessage, type ApplicationIssue, type ApplicationReceipt } from "@/lib/application-validation";
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
  const [requirementsAccepted, setRequirementsAccepted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverIssues, setServerIssues] = useState<ApplicationIssue[]>([]);
  const [uncertain, setUncertain] = useState(false);
  const sending = useRef(false);
  const serverError = useRef<HTMLDivElement>(null);
  const options = { strictSpaces: !onSave, waiting, reserved: onSave ? [] : reserved,
    confirmations: onSave ? undefined : { requirements: requirementsAccepted, privacy: privacyAccepted } };
  const issues = validateApplication(p, options);
  const visibleIssues = [...issues.filter(issue => attempted || touched[issue.field]),
    ...serverIssues.filter(issue => !issues.some(local => local.field === issue.field))];
  const issueFor = (id: string) => visibleIssues.find(issue => issue.field === id);
  const describedBy = (id: string, hint?: string) => [hint, issueFor(id) ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined;
  const mark = (id: string) => { setTouched(value => ({ ...value, [id]: true })); setServerIssues([]); setError(""); };
  function focusField(id: string) {
    requestAnimationFrame(() => {
      const input = document.getElementById(id);
      input?.focus({ preventScroll: true });
      input?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  }
  function feedback(id: string) {
    const issue = issueFor(id);
    return issue ? <p id={`${id}-error`} className="application-field-error"><AlertCircle size={18} aria-hidden="true" />{issue.message}</p> : null;
  }
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<ApplicationReceipt>();
  const selectedCrest = crests.find((crest) => crest.id === p.crest);
  function field(k: "name" | "crest" | "captain", v: string) {
    mark(k === "name" ? "team-name" : k);
    setP((value) => ({ ...value, [k]: v }));
    setReview(false);
  }
  function memberField(index: number, key: keyof Member, value: string) {
    mark(key === "number" ? `player-number-${index}` : `${key}-${index}`);
    setTouched(previous => ({ ...previous, [`confirm-${key}-${index}`]: false }));
    setReview(false);
    setP((previous) => ({
      ...previous,
      members: previous.members.map((member, i) => i === index ? { ...member, [key]: value } : member),
    }));
  }
  async function send() {
    if (sending.current) return;
    sending.current = true;
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
        if (r.error) {
          setError(r.error); setUncertain(!!r.uncertain);
          setServerIssues(r.issues ?? []);
          if (r.issues?.length) focusField(r.issues[0].field);
          else requestAnimationFrame(() => serverError.current?.focus());
        } else if (validReceipt(r.result)) { setResult(r.result); setUncertain(false); focusField("application-result"); }
        else { setError(uncertainMessage); setUncertain(true); requestAnimationFrame(() => serverError.current?.focus()); }
      }
    } catch {
      setError(onSave ? "No se pudo confirmar la corrección. Conservamos tus datos; revisa el estado antes de repetirla." : uncertainMessage);
      if (!onSave) setUncertain(true);
      requestAnimationFrame(() => serverError.current?.focus());
    } finally {
      setBusy(false);
      sending.current = false;
    }
  }
  if (result)
    return (
      <section className="registration-lock" role="status">
        <h2 id="application-result" tabIndex={-1}>
          {result.state === "waiting"
            ? "Solicitud en lista de espera"
            : result.state === "pending" ? "Solicitud recibida: pendiente de revisión" : "Solicitud registrada: " + stateLabels[result.state]}
        </h2>
        <p className="application-reference">Referencia: {result.id}</p>
        <p>Guarda esta referencia para consultar al organizador.</p>
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
            : result.state === "pending" ? "El capitán debe escribir a @whiskyzc desde el TikTok declarado antes del vencimiento indicado. El equipo queda pendiente de aprobación." : "Este es el estado que confirmó el servidor para tu solicitud. Consulta al organizador si necesitas más información."}
        </p>
      </section>
    );
  return (
    <form
      noValidate
      aria-busy={busy}
      className="event-form application-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy || uncertain) return;
        setAttempted(true);
        if (issues.length) { setReview(false); focusField(issues[0].field); return; }
        if (review) void send();
        else { setReview(true); focusField("application-review"); }
      }}
    >
      {visibleIssues.length > 1 && <div className="application-error-summary" role="alert">
        <h3>Revisa estos {visibleIssues.length} campos para continuar</h3>
        <ul>{visibleIssues.map(issue => <li key={issue.field}><a href={`#${issue.field}`} onClick={e => { e.preventDefault(); focusField(issue.field); }}>{issue.label}: {issue.message}</a></li>)}</ul>
      </div>}
      <fieldset disabled={busy || uncertain}>
        <legend>Identidad del equipo</legend>
        <label htmlFor="team-name">Nombre del equipo</label>
        <input
          id="team-name"
          aria-invalid={!!issueFor("team-name")}
          aria-describedby={describedBy("team-name")}
          required
          minLength={3}
          maxLength={60}
          value={p.name}
          onChange={(e) => field("name", e.target.value)}
        />
        {feedback("team-name")}
        <div className="application-crest-picker">
          <div>
            <label htmlFor="crest">Escudo</label>
            <select id="crest" required aria-invalid={!!issueFor("crest")} aria-describedby={describedBy("crest")} value={p.crest} onChange={(e) => field("crest", e.target.value)}>
              <option value="">Elige un escudo</option>
              {crests.map((c) => (
                <option key={c.id} value={c.id} disabled={!onSave && !waiting && reserved.includes(c.id)}>
                  {c.club}{reserved.includes(c.id) ? " · Reservado" : ""}
                </option>
              ))}
            </select>
            {feedback("crest")}
          </div>
          {selectedCrest && (
            <div className="application-crest-preview">
              <Image src={selectedCrest.src} alt={"Escudo de " + selectedCrest.club} width={72} height={72} />
            </div>
          )}
        </div>
        <p>El escudo se reserva al guardar una solicitud con plaza.</p>
      </fieldset>
      <fieldset disabled={busy || uncertain}>
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
                  maxLength={80}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  placeholder={k === "roblox" ? "Jugador_10" : "@jugador.10"}
                  aria-invalid={!!issueFor(`${k}-${i}`)}
                  aria-describedby={describedBy(`${k}-${i}`, `${k}-${i}-help`)}
                  value={m[k]}
                  onChange={(e) => memberField(i, k, e.target.value)}
                />
                <p className="application-field-help" id={`${k}-${i}-help`}>{k === "roblox" ? "Usuario real del perfil, no el nombre visible. De 3 a 20 letras, números o guion bajo." : "Usuario real, con o sin @. De 2 a 24 letras, números, puntos o guiones bajos."}</p>
                {feedback(`${k}-${i}`)}
                {touched[`${k}-${i}`] && m[k] && !usernameError(m[k], k, !onSave) && !issueFor(`${k}-${i}`) && <p className="application-format-ok"><CheckCircle2 size={16} aria-hidden="true" />Formato válido; no verifica la cuenta.</p>}
                {issueFor(`${k}-${i}`) && usernameSuggestion(m[k], k) && <div className="application-suggestion">
                  <p>Sin los espacios: <strong>{usernameSuggestion(m[k], k)}</strong>. No hemos comprobado que esa cuenta exista.</p>
                  <label><input type="checkbox" checked={!!touched[`confirm-${k}-${i}`]} onChange={e => setTouched(previous => ({ ...previous, [`confirm-${k}-${i}`]: e.target.checked }))} />He comprobado que este usuario corresponde a la cuenta del integrante.</label>
                  <button className="trophy-button" type="button" disabled={!touched[`confirm-${k}-${i}`]} onClick={() => {
                    const suggestion = usernameSuggestion(m[k], k);
                    if (suggestion) { memberField(i, k, suggestion); setTouched(previous => ({ ...previous, [`confirm-${k}-${i}`]: false })); focusField(`${k}-${i}`); }
                  }}>Usar sugerencia</button>
                </div>}
              </div>
            ))}
            <div className="player-number">
              <label htmlFor={"player-number-" + i}>Número del jugador (opcional)</label>
              <input id={"player-number-" + i} inputMode="numeric" placeholder="01–99"
                pattern="0[1-9]|[1-9][0-9]" maxLength={8} value={m.number ?? ""}
                aria-invalid={!!issueFor(`player-number-${i}`)} aria-describedby={describedBy(`player-number-${i}`, "player-number-help")} onChange={(e) => memberField(i, "number", e.target.value)} />
              {feedback(`player-number-${i}`)}
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
          aria-invalid={!!issueFor("captain")} aria-describedby={describedBy("captain")}
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
        {feedback("captain")}
      </fieldset>
      {!onSave && (
        <fieldset disabled={busy || uncertain}>
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
          <label className={issueFor("requirements-confirmation") ? "application-confirmation-invalid" : undefined}>
            <input id="requirements-confirmation" type="checkbox" required checked={requirementsAccepted} aria-invalid={!!issueFor("requirements-confirmation")} aria-describedby={describedBy("requirements-confirmation")} onChange={e => { setRequirementsAccepted(e.target.checked); mark("requirements-confirmation"); setReview(false); }} /> He revisado la plantilla, los requisitos y la publicación de los nombres de Roblox.
          </label>
          {feedback("requirements-confirmation")}
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
          <h2 id="application-review" tabIndex={-1}>{onSave ? "Revisa la corrección" : "Revisa tu solicitud"}</h2>
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
          {!onSave && <p>Todavía no has enviado los datos. {waiting ? "Lista de espera sin reservas." : "La solicitud quedará pendiente de confirmación y revisión."}</p>}
          <button className="trophy-button" type="button" disabled={busy || uncertain} onClick={() => { setReview(false); focusField("team-name"); }}>Volver a editar</button>
        </section>
      )}
      {!onSave && <section className="registration-lock">
        <p>Whisky usa estos datos para organizar el torneo. Equipo, escudo y Roblox pueden publicarse. TikTok y el número del jugador quedan privados. <a href="/privacidad" target="_blank" rel="noopener noreferrer">Aviso de privacidad</a>.</p>
        {privacyVersion ? <label className={issueFor("privacy-confirmation") ? "application-confirmation-invalid" : undefined}><input id="privacy-confirmation" type="checkbox" disabled={busy || uncertain} checked={privacyAccepted} aria-invalid={!!issueFor("privacy-confirmation")} aria-describedby={describedBy("privacy-confirmation")} onChange={e=> { setPrivacyAccepted(e.target.checked); mark("privacy-confirmation"); setReview(false); }} required /> He leído el aviso de privacidad presentado (versión {privacyVersion}).</label> : <p>Falta completar el aviso definitivo y el procedimiento de autorización de los integrantes y menores. El envío todavía no está habilitado.</p>}
        {feedback("privacy-confirmation")}
        <p>La aceptación registra la decisión de quien envía. El organizador debe verificar por separado la autorización de cada integrante.</p>
      </section>}
      <p role="status">{notice}</p>
      {error && <div className="application-error-summary" role="alert" tabIndex={-1} ref={serverError}><p><AlertCircle size={20} aria-hidden="true" />{error}</p></div>}
      {uncertain && <button className="action-link" type="button" disabled={busy} onClick={() => void send()}>{busy ? "Comprobando…" : "Comprobar este mismo envío"}</button>}
      {!uncertain && <button className="action-link" disabled={busy || (!onSave && !privacyVersion)}>
        {busy && <LoaderCircle className="application-spinner" size={20} aria-hidden="true" />}
        {busy
          ? onSave ? "Guardando…" : "Enviando solicitud…"
          : review
            ? onSave
              ? "Guardar corrección"
              : "Enviar solicitud"
            : "Revisar datos"}
      </button>}
    </form>
  );
}
