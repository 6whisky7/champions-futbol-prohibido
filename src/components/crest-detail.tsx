"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type RefObject } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import type { Crest } from "@/lib/crests";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
type Availability = {
  events: { id: string; name: string }[];
  selected: null | {
    id: string;
    name: string;
    reserved: string[];
    free: number;
    open: boolean;
  };
};
export function CrestDetail({
  crest,
  eventId,
  changeEvent,
  close,
  returnFocus,
}: {
  crest?: Crest;
  eventId: string;
  changeEvent: (id: string) => void;
  close: () => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  return (
    <Dialog
      open={!!crest}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className="crest-dialog"
        finalFocus={() =>
          returnFocus.current?.isConnected
            ? returnFocus.current
            : (document.getElementById("crest-search") ?? undefined)
        }
      >
        {crest && (
          <>
            <DialogHeader>
              <DialogTitle>Escudo {crest.id}</DialogTitle>
              <DialogDescription>
                Diseño original inspirado en {crest.club} · {crest.league}.
              </DialogDescription>
            </DialogHeader>
            <div className="crest-detail-layout">
              <div className="crest-detail-art">
                <Image
                  loading="eager"
                  src={crest.src}
                  alt={`Diseño ${crest.id} completo`}
                  width={400}
                  height={400}
                  sizes="(max-width:600px) 75vw, 340px"
                />
              </div>
              <div>
                <CrestAvailability
                  key={eventId + "|" + crest.id}
                  crest={crest}
                  eventId={eventId}
                  changeEvent={changeEvent}
                />
                <p className="admin-note">
                  Consultar o elegir un escudo no lo reserva. La disponibilidad
                  se comprueba de nuevo al enviar la solicitud.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
function CrestAvailability({
  crest,
  eventId,
  changeEvent,
}: {
  crest: Crest;
  eventId: string;
  changeEvent: (id: string) => void;
}) {
  const [result, setResult] = useState<Availability | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(
      "/api/escudos" +
        (eventId ? "?evento=" + encodeURIComponent(eventId) : ""),
      { cache: "no-store", signal: ctrl.signal },
    )
      .then(async (r) => {
        if (!r.ok)
          throw Error(
            "No pudimos consultar este evento. Comprueba la selección o reintenta.",
          );
        return r.json();
      })
      .then((d) => {
        if (!ctrl.signal.aborted) {
          setResult(d);
          setError("");
        }
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e.message);
      });
    return () => ctrl.abort();
  }, [eventId, retry]);
  const event = result?.selected,
    occupied = event?.reserved.includes(crest.id);
  return (
    <div className="crest-availability">
      <label htmlFor="crest-event">Consultar disponibilidad en</label>
      <select
        id="crest-event"
        value={eventId}
        onChange={(e) => changeEvent(e.target.value)}
      >
        <option value="">Elige un evento</option>
        {result?.events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
            Reintentar consulta
          </Button>
          <Button variant="ghost" onClick={() => changeEvent("")}>
            Elegir otro evento
          </Button>
        </div>
      ) : !result ? (
        <p role="status">Consultando disponibilidad…</p>
      ) : !event ? (
        <p>
          {result.events.length
            ? "Elige un evento para ver si este escudo está libre."
            : "Todavía no hay eventos publicados."}
        </p>
      ) : (
        <>
          <Badge
            variant="outline"
            className={occupied ? "crest-occupied" : "crest-free"}
          >
            {occupied ? (
              <LockKeyhole aria-hidden="true" />
            ) : (
              <CheckCircle2 aria-hidden="true" />
            )}
            {occupied ? "Ocupado en este evento" : "Disponible en este evento"}
          </Badge>
          <p>
            {event.name} · Inscripciones{" "}
            {event.open ? "abiertas" : "no disponibles"}.
          </p>
          {event.open && (event.free === 0 || !occupied) ? (
            <Link
              className="action-link"
              href={`/eventos/${event.id}?escudo=${crest.id}#inscripcion`}
            >
              {event.free === 0
                ? "Apuntarme a la lista de espera"
                : "Inscribir mi equipo con este escudo"}
            </Link>
          ) : event.open ? (
            <p>Elige otro escudo para solicitar una plaza disponible.</p>
          ) : (
            <Link href={`/eventos/${event.id}`}>Consultar evento</Link>
          )}
          {event.open && event.free === 0 && (
            <p>La espera no reserva escudo, jugadores ni plaza.</p>
          )}
        </>
      )}
    </div>
  );
}
