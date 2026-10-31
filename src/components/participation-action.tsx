"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
type Availability = { id: string; name: string; free: number | null };

export function ParticipationAction() {
  const [available, setAvailable] = useState<Availability[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/participacion", { signal: controller.signal, cache: "no-store" })
      .then(async response => { if (!response.ok) throw Error("Unavailable"); return response.json(); })
      .then(data => setAvailable(data.events))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  if (failed) return <div className="participation-action"><p>No pudimos consultar las inscripciones.</p><Link className="action-link" href="/eventos">Consultar eventos <ArrowRight /></Link></div>;
  if (!available) return <div className="participation-action" aria-busy="true"><p role="status">Consultando inscripciones disponibles…</p><Link className="plain-link" href="/eventos">Consultar eventos</Link></div>;
  if (available.length > 1) return <div className="participation-action"><p>Elige el evento en el que quieres participar. Cada edición indica sus plazas y lista de espera.</p><Link className="action-link" href="/eventos?inscripciones=abiertas">Elegir evento <ArrowRight /></Link></div>;
  const event = available[0];
  if (event) return <div className="participation-action"><p>{event.name} · {event.free === null ? "Consulta las plazas disponibles" : event.free === 0 ? "Cupo lleno. Puedes solicitar entrada en espera; no reserva plaza." : `${event.free} plazas disponibles. Una solicitud pendiente también ocupa plaza.`}</p><Link className="action-link" href={`/eventos/${event.id}#inscripcion`}>{event.free === 0 ? "Apuntarme a la lista de espera" : event.free === null ? "Consultar inscripción" : "Inscribir mi equipo"}<ArrowRight /></Link></div>;
  return <div className="participation-action"><p>Ahora no hay inscripciones abiertas. Anunciaremos las próximas convocatorias en nuestra comunidad.</p><a className="action-link" href="https://www.tiktok.com/@whiskyzc" target="_blank" rel="noopener noreferrer">Seguir las convocatorias en TikTok <ArrowRight /></a><a className="plain-link" href="https://tiktok.me/group/ZSgLCxnLr/" target="_blank" rel="noopener noreferrer">Entrar en La Chapizza <ArrowRight /></a></div>;
}
