"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { ObsDocument } from "@/lib/obs-types";
import { getCrest } from "@/lib/crests";
import { classificationZone, unresolved } from "@/lib/public-matches";
import { liveTime } from "@/lib/live";
import { knockoutLabels } from "@/lib/knockout";
export function ObsCanvas({
  initial,
  query,
}: {
  initial: ObsDocument;
  query: string;
}) {
  const [data, setData] = useState<ObsDocument | null>(initial),
    [error, setError] = useState("");
  useEffect(() => {
    let stopped = false,
      controller: AbortController | undefined,
      timer: ReturnType<typeof setTimeout> | undefined,
      generation = 0;
    async function poll(g: number) {
      if (stopped || document.hidden || g !== generation) return;
      controller = new AbortController();
      try {
        const r = await fetch(
          `/api/obs/${initial.event.id}/${initial.view}?${query}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (r.status === 404) {
          setData(null);
          setError("No hay datos publicados para esta vista.");
          return;
        }
        if (!r.ok) throw Error();
        const next = (await r.json()) as ObsDocument;
        if (!stopped && g === generation) {
          setData((old) =>
            old &&
            old.match &&
            next.match &&
            (old.match.official_revision > next.match.official_revision ||
              (old.match.official_revision === next.match.official_revision &&
                (old.match.working?.revision ?? 0) >
                  (next.match.working?.revision ?? 0)))
              ? old
              : next,
          );
          setError("");
        }
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError")
          setError("Sin actualización · se conserva la última lectura");
      } finally {
        if (!stopped && g === generation && !document.hidden)
          timer = setTimeout(() => void poll(g), 5000);
      }
    }
    const visibility = () => {
      generation++;
      clearTimeout(timer);
      controller?.abort();
      if (!document.hidden) void poll(generation);
    };
    void poll(generation);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [initial.event.id, initial.view, query]);
  return (
    <main className={`obs-canvas obs-${initial.view}`}>
      <header>
        <p>CHAMPIONS FÚTBOL PROHIBIDO</p>
        <h1>{data?.event.name ?? "Vista pública no disponible"}</h1>
      </header>
      {error && (
        <p className="obs-error" role="status">
          {error}
        </p>
      )}
      {data?.view === "marcador" &&
        (data.match ? (
          <>
            <div className="obs-score">
              {[0, 1].map((i) => {
                const m = data.match!,
                  crest = i === 0 ? m.home_crest : m.away_crest;
                return (
                  <section key={i}>
                    {crest && (
                      <Image
                        src={getCrest(crest).src}
                        alt=""
                        width={120}
                        height={120}
                      />
                    )}
                    <h2>
                      {(i === 0 ? m.home_name : m.away_name) ?? "Por definir"}
                    </h2>
                    <strong>
                      {unresolved(m.kind)
                        ? ((i === 0 ? m.working?.hg : m.working?.ag) ?? 0)
                        : ((i === 0 ? m.hg : m.ag) ?? "—")}
                    </strong>
                  </section>
                );
              })}
            </div>
            <p>
              {data.match.phase_label} ·{" "}
              {unresolved(data.match.kind)
                ? "Marcador de trabajo · provisional"
                : (knockoutLabels[data.match.kind] ?? "Resultado oficial")}
            </p>
            {unresolved(data.match.kind) && (
              <ObsTimer
                now={data.now}
                called={data.match.working?.called_at ?? null}
              />
            )}
          </>
        ) : (
          <p>Sin partidos confirmados para este marcador.</p>
        ))}
      {data?.view === "clasificacion" && (
        <>
          <h2>
            Clasificación{" "}
            {!data.leagueState
              ? "por preparar"
              : data.leagueState === "closed"
                ? "final"
                : "provisional"}
          </h2>
          {data.table?.length ? (
            <>
              <div
                className="obs-table-wrap"
                role="region"
                aria-label="Clasificación pública para OBS"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      {[
                        "Pos.",
                        "Equipo",
                        "PJ",
                        "GF",
                        "GC",
                        "DG",
                        "Pts",
                        "Zona",
                      ].map((x) => (
                        <th key={x} scope="col">
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.table.map((r) => {
                      const zone = classificationZone(r, {
                        state:
                          data.leagueState === "closed" ? "closed" : "active",
                        format: data.format ?? "",
                        qualified: data.qualified ?? 0,
                      });
                      return (
                        <tr key={r.id}>
                          <td>
                            {r.tie_pending ? "=" : ""}
                            {r.position}
                          </td>
                          <th scope="row">{r.name}</th>
                          {[r.pj, r.gf, r.gc, r.dg, r.points].map((v, i) => (
                            <td key={i}>{v}</td>
                          ))}
                          <td>
                            {zone.label}
                            {r.administrative_gc
                              ? " · GC de sanción incluidos"
                              : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p>
                Página {data.page} de {Math.ceil((data.total ?? 0) / 12) || 1} ·{" "}
                {(data.page! - 1) * 12 + 1}–
                {Math.min(data.page! * 12, data.total!)} de {data.total}{" "}
                equipos. Pendientes «=»: zona por resolver.
              </p>
            </>
          ) : (
            <p>La clasificación todavía no está confirmada.</p>
          )}
        </>
      )}
      {data?.view === "cuadro" && (
        <>
          <h2>
            Cuadro{" "}
            {!data.knockout
              ? "por preparar"
              : data.knockout.state === "finished"
                ? "terminado"
                : "confirmado"}
          </h2>
          {data.knockout ? (
            <div
              className="obs-bracket"
              role="region"
              aria-label="Cuadro público"
              tabIndex={0}
            >
              {[...new Set(data.knockout.matches.map((m) => m.round))]
                .filter((r) => data.round === null || r === data.round)
                .map((r) => (
                  <section key={r}>
                    <h3>
                      {r === 0
                        ? "Repesca"
                        : r ===
                            Math.max(
                              ...data.knockout!.matches.map((m) => m.round),
                            )
                          ? "Final"
                          : `Ronda ${r}`}
                    </h3>
                    {data
                      .knockout!.matches.filter((m) => m.round === r)
                      .map((m) => (
                        <article key={m.id}>
                          <h4>Partido {m.number}</h4>
                          <p>
                            {data.knockout!.teams.find((t) => t.id === m.home)
                              ?.name ?? "Ganador por definir"}{" "}
                            <strong>{m.hg ?? "—"}</strong>
                          </p>
                          <p>
                            {data.knockout!.teams.find((t) => t.id === m.away)
                              ?.name ?? "Ganador por definir"}{" "}
                            <strong>{m.ag ?? "—"}</strong>
                          </p>
                          <small>{knockoutLabels[m.kind]}</small>
                        </article>
                      ))}
                  </section>
                ))}
            </div>
          ) : (
            <p>El cuadro todavía no está confirmado.</p>
          )}
        </>
      )}
      {data && (
        <footer>
          Última lectura: {new Date(data.now).toISOString().slice(11, 19)} UTC ·
          Solo información pública
        </footer>
      )}
    </main>
  );
}
function ObsTimer({ now, called }: { now: string; called: string | null }) {
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    if (!called) return;
    const offset = Date.parse(now) - Date.now(),
      tick = () => {
        if (!document.hidden) setSeconds(liveTime(called, Date.now() + offset));
      };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [now, called]);
  return (
    <p className="obs-wait" aria-live="off">
      {!called
        ? "Sin convocatoria activa"
        : seconds === null
          ? "Preparando reloj de espera…"
          : seconds === 0
            ? "Espera completada · decisión del propietario"
            : `Espera ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
    </p>
  );
}
