"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicMatch } from "@/lib/public-matches";
export function NextMatch({ eventId, match, compact=false }: { eventId: string; match: PublicMatch | null; compact?:boolean }) {
  const [clock, setClock] = useState<{ now: number; local: string } | null>(null);
  useEffect(() => {
    if (!match?.scheduled_at) return;
    const update = () => { if (!document.hidden) setClock({ now: Date.now(), local: new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short", timeZoneName: undefined }).format(new Date(match.scheduled_at!)) + " · " + Intl.DateTimeFormat().resolvedOptions().timeZone }); };
    update(); const timer = setInterval(update, 1000); document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [match?.scheduled_at]);
  const seconds = clock && match?.scheduled_at ? Math.max(0, Math.ceil((Date.parse(match.scheduled_at) - clock.now) / 1000)) : null;
  const countdown = seconds === null ? "Preparando cuenta regresiva…" : seconds === 0 ? "Hora prevista alcanzada. Espera la convocatoria del organizador." : `${Math.floor(seconds / 86400)} d · ${String(Math.floor(seconds / 3600) % 24).padStart(2,"0")} h · ${String(Math.floor(seconds / 60) % 60).padStart(2,"0")} min · ${String(seconds % 60).padStart(2,"0")} s`;
  return <section className={compact?'next-match next-match-compact':'admin-surface next-match'}><p className="next-match-label">Próximo partido programado</p>
    {match?.scheduled_at ? <><h2>{match.homeName} <span>contra</span> {match.awayName}</h2><p>{match.phase}</p>
      <p><strong>Costa Rica:</strong> <time dateTime={match.scheduled_at}>{new Date(Date.parse(match.scheduled_at)-6*3600000).toISOString().slice(0,16).replace("T"," · ")}</time> (UTC−6)</p>
      <p>{clock ? `En tu zona: ${clock.local}` : "Tu hora local aparecerá al cargar la página."}</p><p className="match-countdown" aria-live="off">{countdown}</p>
      <div className="admin-tabs"><Link className="action-link" href={`/eventos/${eventId}/partidos/${match.id}`}>Ver partido</Link><a className="trophy-button" href={`/eventos/${eventId}/partidos/${match.id}/calendario`}>Añadir a mi calendario (.ics)</a></div><p className="admin-note">La descarga no se sincroniza automáticamente. Revisa aquí los cambios de horario; la cuenta regresiva no inicia el partido ni la espera de cinco minutos.</p></> : <><h2>Horario por confirmar</h2><p>El organizador todavía no ha programado un próximo partido con ambos equipos definidos. Consulta el calendario para ver los cruces confirmados.</p><Link href={`/eventos/${eventId}/calendario`}>Consultar calendario</Link></>}
  </section>;
}
