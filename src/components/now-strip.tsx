"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Radio, Users } from "lucide-react";
import type { NowData } from "@/lib/now";
import { NextMatch } from "./next-match";
export function NowStrip({ eventId }: { eventId?: string }) {
  const [state, setState] = useState<{ key: string; data: NowData } | null>(
      null,
    ),
    [error, setError] = useState(false);
  const key = eventId ?? "";
  useEffect(() => {
    let gone = false,
      ctrl: AbortController | undefined,
      timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      if (document.hidden || gone) return;
      ctrl = new AbortController();
      try {
        const r = await fetch("/api/ahora" + (key ? "?evento=" + key : ""), {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!r.ok) throw Error();
        const data = await r.json();
        if (!gone) {
          setState({ key, data });
          setError(false);
        }
      } catch (e) {
        if (!gone && e instanceof Error && e.name !== "AbortError")
          setError(true);
      } finally {
        if (!gone) timer = setTimeout(run, 60000);
      }
    };
    const visible = () => {
      clearTimeout(timer);
      ctrl?.abort();
      if (!document.hidden) void run();
    };
    void run();
    document.addEventListener("visibilitychange", visible);
    return () => {
      gone = true;
      clearTimeout(timer);
      ctrl?.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, [key]);
  const d = state?.key === key ? state.data : null;
  return (
    <section className="now-strip page-width" aria-labelledby="now-title">
      <div className="now-heading">
        <h2 id="now-title">Ahora</h2>
        <p>{d?.event?.name ?? "Champions Fútbol Prohibido"}</p>
      </div>
      {error ? (
        <p role="status">
          No hay actualización disponible.{" "}
          <Link href="/eventos">Consultar eventos</Link>
        </p>
      ) : !d ? (
        <p role="status">Consultando calendario e inscripciones…</p>
      ) : (
        <div className="now-content">
          <div className="now-schedule">
            <CalendarClock aria-hidden="true" />
            {d.event ? (
              <NextMatch eventId={d.event.id} match={d.match} compact />
            ) : (
              <p>
                No hay partidos programados.{" "}
                <Link href="/eventos">Ver eventos</Link>
              </p>
            )}
          </div>
          <div className="now-registration">
            <Users aria-hidden="true" />
            <h3>Inscripciones</h3>
            <p>
              {d.open
                ? d.free
                  ? `${d.free} plazas disponibles`
                  : "Cupo lleno · espera disponible"
                : "No disponibles en este momento"}
            </p>
            {d.open && d.event && (
              <Link href={`/eventos/${d.event.id}#inscripcion`}>
                {d.free ? "Inscribir mi equipo" : "Apuntarme a la espera"}
              </Link>
            )}
          </div>
          {d.called && (
            <div className="now-live">
              <Radio aria-hidden="true" />
              <h3>Partido convocado</h3>
              <p>
                El organizador confirmó la convocatoria. El horario por sí solo
                no indica que esté en vivo.
              </p>
              <a
                href="https://www.tiktok.com/@whiskyzc"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir canal de Whisky
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
