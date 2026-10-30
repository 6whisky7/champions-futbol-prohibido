"use client";
import { useActionState } from "react";
import { saveEvent } from "@/app/admin/actions";
import { eventFormats, localDate, type TournamentEvent } from "@/lib/events";
export function EventForm({ event }: { event?: TournamentEvent }) {
  const [state, action, pending] = useActionState(saveEvent, { message: "" });
  return <form action={action} className="event-form">
    <input type="hidden" name="id" value={event?.id ?? ""} /><input type="hidden" name="updated_at" value={event?.updated_at ?? ""} />
    <label htmlFor="name">Nombre del evento</label><input id="name" name="name" minLength={3} maxLength={100} required defaultValue={event?.name} />
    <label htmlFor="description">Descripción</label><textarea id="description" name="description" rows={4} maxLength={5000} defaultValue={event?.description} />
    <p>Fechas y horas de Costa Rica (UTC−6).</p>
    <label htmlFor="starts_at">Inicio</label><input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={localDate(event?.starts_at)} />
    <label htmlFor="ends_at">Final previsto (opcional)</label><input id="ends_at" name="ends_at" type="datetime-local" defaultValue={localDate(event?.ends_at)} />
    <label htmlFor="format">Formato</label><select id="format" name="format" defaultValue={event?.format ?? "quarters"}>{Object.entries(eventFormats).map(([value, f]) => <option key={value} value={value}>{f.label} · mínimo {f.minimum}</option>)}</select>
    <label htmlFor="capacity">Cupo de equipos (número par)</label><input id="capacity" name="capacity" type="number" min={8} step={2} required defaultValue={event?.capacity ?? 8} />
    <label htmlFor="eliminate_after_league">Al terminar la liguilla</label><select id="eliminate_after_league" name="eliminate_after_league" defaultValue={event?.eliminate_after_league === false ? "no" : "yes"}><option value="yes">Clasifican los mejores; puede haber eliminados</option><option value="no">Continúan todos los equipos</option></select>
    <p>Cuartos: 4 rivales y 8 clasificados. Octavos: 6 y 16. Dieciseisavos: 8 y 32. Repesca: 8 rivales y 24 que continúan (8 directos y 16 a repesca). Sin eliminación, el cupo debe coincidir con los que continúan.</p>
    <label htmlFor="status">Visibilidad</label><select id="status" name="status" defaultValue={event?.status ?? "draft"}><option value="draft">Borrador privado</option><option value="published">Publicado</option></select>
    <fieldset className="registration-lock"><legend>Inscripciones cerradas</legend><p>La apertura está bloqueada hasta implementar el formulario, la revisión de equipos y el control de cupos. Publicar un evento solo permite consultar su información.</p><button className="trophy-button" type="button" disabled>Abrir inscripciones (pendiente)</button></fieldset>
    <input type="hidden" name="registration_status" value="closed" />
    <p role="alert">{state.message}</p><button className="action-link" disabled={pending}>{pending ? "Guardando…" : "Guardar evento"}</button>
  </form>;
}
