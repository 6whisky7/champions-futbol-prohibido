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
    <label htmlFor="review_hours">Plazo para confirmar y revisar (horas)</label><input id="review_hours" name="review_hours" type="number" min={1} max={720} required defaultValue={event?.review_hours??48}/>
    <label htmlFor="registration_status">Inscripciones</label><select id="registration_status" name="registration_status" defaultValue={event?.registration_status??"closed"}><option value="closed">Cerradas</option><option value="open">Abiertas (solo con evento publicado)</option></select><p>Cerrar impide nuevos envíos y promociones. Las solicitudes pendientes conservan su vencimiento. Cambiar el plazo afecta únicamente las reservas nuevas.</p>
    <p role="alert">{state.message}</p><button className="action-link" disabled={pending}>{pending ? "Guardando…" : "Guardar evento"}</button>
  </form>;
}
