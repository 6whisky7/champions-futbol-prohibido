"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { localDate } from "@/lib/events";
import { knockoutDate as eventDate } from "@/lib/knockout";
import type { League } from "@/lib/league/types";
import { unresolved } from "@/lib/public-matches";
import { saveRoundSchedule } from "@/app/admin/round-schedule-action";
import { Button } from "./ui/button";
export function RoundSchedule({
  data,
  eventId,
  round,
}: {
  data: League;
  eventId: string;
  round: number;
}) {
  const matches = data.matches.filter(
    (m) => m.round === round && unresolved(m.kind),
  );
  const [open, setOpen] = useState(false),
    [dates, setDates] = useState<Record<string, string>>(() =>
      Object.fromEntries(matches.map((m) => [m.id, localDate(m.scheduled_at)])),
    ),
    [start, setStart] = useState(""),
    [gap, setGap] = useState(15),
    [reason, setReason] = useState(""),
    [review, setReview] = useState<{
      revision: number;
      rows: { id: string; date: string }[];
    } | null>(null),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<{
      saved: string[];
      unchanged: string[];
      error: string | null;
      total: number;
    } | null>(null);
  const router = useRouter(),
    name = (id: string) =>
      data.teams.find((t) => t.id === id)?.name ?? "Equipo";
  if (!matches.length)
    return (
      <p className="admin-note">
        Jornada resuelta. Sus horarios se conservan; las correcciones
        individuales siguen en el detalle.
      </p>
    );
  return (
    <section className="round-schedule" id="round-schedule">
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="round-schedule-form"
      >
        Asignar fechas a la jornada
      </Button>
      {open && (
        <div id="round-schedule-form">
          <h3>Horarios de jornada {round}</h3>
          <p>
            Solo partidos sin resolver. Se conservan rivales, resoluciones y
            fechas de los partidos jugados. Todo se revisa antes de guardar.
          </p>
          {result && (
            <div
              className="schedule-result"
              role={result.error ? "alert" : "status"}
            >
              <strong>
                {result.error ? "Guardado incompleto" : "Fechas guardadas"}
              </strong>
              <p>
                {result.saved.length + result.unchanged.length} de{" "}
                {result.total} horarios confirmados. {result.saved.length}{" "}
                guardados; {result.unchanged.length} ya coincidían y no se
                volvieron a guardar.
              </p>
              {result.error && (
                <p>
                  {result.error} El último intento podría haberse guardado si se
                  cortó la conexión; consulta antes de repetir.
                </p>
              )}
              {result.saved.length > 0 && (
                <ul>
                  {result.saved.map((id) => {
                    const m = data.matches.find((m) => m.id === id)!;
                    return (
                      <li key={id}>
                        {name(m.home)} contra {name(m.away)}
                      </li>
                    );
                  })}
                </ul>
              )}
              <Button variant="outline" onClick={() => router.refresh()}>
                Revisar lo guardado
              </Button>
            </div>
          )}
          {!review ? (
            <form
              className="event-form"
              onSubmit={(e) => {
                e.preventDefault();
                setResult(null);
                setReview({
                  revision: data.revision,
                  rows: matches.map((m) => ({
                    id: m.id,
                    date: new Date(dates[m.id] + ":00-06:00").toISOString(),
                  })),
                });
              }}
            >
              <fieldset className="schedule-sequence">
                <legend>Preparar una secuencia editable</legend>
                <label htmlFor="round-start">
                  Primer partido · hora de Costa Rica
                </label>
                <input
                  id="round-start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
                <label htmlFor="round-gap">
                  Separación entre horarios · minutos
                </label>
                <input
                  id="round-gap"
                  type="number"
                  min={0}
                  max={180}
                  value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                />
                <Button
                  variant="outline"
                  disabled={
                    !start || !Number.isInteger(gap) || gap < 0 || gap > 180
                  }
                  onClick={() => {
                    const base = Date.parse(start + ":00-06:00");
                    if (Number.isFinite(base))
                      setDates(
                        Object.fromEntries(
                          matches.map((m, i) => [
                            m.id,
                            localDate(
                              new Date(base + i * gap * 60000).toISOString(),
                            ),
                          ]),
                        ),
                      );
                  }}
                >
                  Preparar horarios sin guardar
                </Button>
                <p className="admin-note">
                  La separación organiza el calendario; no cambia la duración ni
                  las reglas del partido.
                </p>
              </fieldset>
              {matches.map((m) => (
                <div className="schedule-match" key={m.id}>
                  <label htmlFor={"date-" + m.id}>
                    {name(m.home)} contra {name(m.away)}
                  </label>
                  <input
                    required
                    id={"date-" + m.id}
                    type="datetime-local"
                    value={dates[m.id] ?? ""}
                    onChange={(e) =>
                      setDates({ ...dates, [m.id]: e.target.value })
                    }
                  />
                </div>
              ))}
              <label htmlFor="round-reason">Motivo de las fechas</label>
              <input
                id="round-reason"
                required
                minLength={3}
                maxLength={900}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button type="submit">Revisar fechas</Button>
            </form>
          ) : (
            <div className="schedule-review">
              <h4>Revisión antes de guardar</h4>
              <ol>
                {review.rows.map((r) => {
                  const m = data.matches.find((m) => m.id === r.id)!;
                  return (
                    <li key={r.id}>
                      <strong>
                        {name(m.home)} contra {name(m.away)}
                      </strong>
                      <time dateTime={r.date}>{eventDate(r.date)}</time>
                    </li>
                  );
                })}
              </ol>
              <p>
                Cada horario conserva historial. Si otra pestaña cambia la
                competición se detiene el guardado; revisa lo que ya se haya
                confirmado.
              </p>
              {data.revision !== review.revision && (
                <p role="status">
                  La versión cambió. Vuelve a preparar la revisión con el
                  calendario actual.
                </p>
              )}
              <div className="admin-tabs">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setReview(null)}
                >
                  Volver a editar fechas
                </Button>
                <Button
                  disabled={busy || data.revision !== review.revision}
                  onClick={async () => {
                    setBusy(true);
                    setResult(null);
                    try {
                      const r = await saveRoundSchedule(
                        eventId,
                        round,
                        review.rows,
                        review.revision,
                        reason,
                      );
                      setResult({ ...r, total: review.rows.length });
                      if (!r.error) setReview(null);
                      router.refresh();
                      if (r.saved.length) {
                        window.dispatchEvent(new Event("cfp-admin-refresh"));
                      }
                    } catch {
                      setResult({
                        saved: [],
                        unchanged: [],
                        total: review.rows.length,
                        error:
                          "No se pudo confirmar el guardado. Revisa el calendario antes de repetir.",
                      });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "Guardando…" : "Guardar fechas revisadas"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
