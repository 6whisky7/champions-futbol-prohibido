"use client";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { League } from "@/lib/league/types";
import { matchLabels } from "@/lib/league/types";
import { knockoutLabels } from "@/lib/knockout";
import {
  classificationZone,
  unresolved,
  type PublicMatch,
} from "@/lib/public-matches";
import { competitionCsv } from "@/lib/csv";
type Cell = string | number | null;
function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function CompetitionExport({
  event,
  league,
  matches,
}: {
  event: { id: string; name: string };
  league: Pick<League, "state" | "table" | "format" | "qualified"> | null;
  matches: PublicMatch[];
}) {
  const [view, setView] = useState("standings"),
    [page, setPage] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const sheet = useRef<HTMLDivElement>(null);
  const headers =
    view === "standings"
      ? [
          "Pos.",
          "Equipo",
          "PJ",
          "PG",
          "PP",
          "PN",
          "GF",
          "GC",
          "GC adm.",
          "DG",
          "Pts",
          "Zona",
        ]
      : [
          "Fase",
          "Local",
          "Goles",
          "Visitante",
          "Resolución",
          "Hora de Costa Rica",
        ];
  const rows: Cell[][] =
    view === "standings"
      ? (league?.table ?? []).map((r) => [
          `${r.tie_pending ? "=" : ""}${r.position}`,
          r.name,
          r.pj,
          r.pg,
          r.pp,
          r.pn,
          r.gf,
          r.gc,
          r.administrative_gc,
          r.dg,
          r.points,
          classificationZone(r, league!).label,
        ])
      : matches
          .filter((m) => !unresolved(m.kind))
          .map((m) => [
            m.phase,
            m.homeName,
            m.hg === null || m.ag === null ? "Sin goles" : `${m.hg}–${m.ag}`,
            m.awayName,
            knockoutLabels[m.kind] ??
              matchLabels[m.kind] ??
              "Resolución oficial",
            m.scheduled_at
              ? new Date(Date.parse(m.scheduled_at) - 6 * 3600000)
                  .toISOString()
                  .slice(0, 16)
                  .replace("T", " ")
              : "Sin fecha asignada",
          ]);
  const pages = Math.max(1, Math.ceil(rows.length / 10)),
    current = Math.min(page, pages - 1),
    title =
      view === "standings"
        ? `Clasificación ${league?.state === "closed" ? "final" : "provisional"}`
        : "Resultados oficiales",
    filename = `cfp-${event.id}-${view}`;
  async function image(format: "png" | "pdf") {
    if (!sheet.current || busy || !rows.length) return;
    setBusy(true);
    setMessage("Preparando exportación…");
    const previous = current;
    try {
      await document.fonts.ready;
      const { toPng, getFontEmbedCSS } = await import("html-to-image"),
        fontEmbedCSS = await getFontEmbedCSS(sheet.current, {
          preferredFontFormat: "woff2",
        });
      const capture = () =>
        toPng(sheet.current!, {
          pixelRatio: 2,
          fontEmbedCSS,
          backgroundColor: "#020612",
        });
      if (format === "png") {
        const uri = await capture();
        download(
          `${filename}-pagina-${current + 1}.png`,
          await (await fetch(uri)).blob(),
        );
        setMessage(`Imagen de la página ${current + 1} descargada.`);
      } else {
        const { jsPDF } = await import("jspdf");
        let pdf: InstanceType<typeof jsPDF> | undefined;
        for (let i = 0; i < pages; i++) {
          // A DOM capture library needs this specific page committed before reading its layout.
          flushSync(() => setPage(i));
          setMessage(`Preparando PDF · página ${i + 1} de ${pages}`);
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
          const uri = await capture(),
            height = sheet.current!.offsetHeight,
            orientation = height > 1280 ? "portrait" : "landscape";
          if (!pdf)
            pdf = new jsPDF({
              orientation,
              unit: "px",
              format: [1280, height],
              compress: true,
            });
          else pdf.addPage([1280, height], orientation);
          pdf.addImage(uri, "PNG", 0, 0, 1280, height, undefined, "FAST");
        }
        pdf!.setProperties({
          title: `${event.name} · ${title}`,
          author: "Champions Fútbol Prohibido",
        });
        pdf!.save(`${filename}.pdf`);
        setMessage(
          `PDF de ${pages} ${pages === 1 ? "página" : "páginas"} descargado.`,
        );
      }
    } catch {
      setMessage(
        "No se pudo generar el archivo en este navegador. Conserva la página, reintenta o descarga el CSV; también puedes usar Imprimir / Guardar como PDF.",
      );
    } finally {
      setPage(previous);
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="export-controls">
        <label htmlFor="export-view">
          Contenido
          <select
            id="export-view"
            disabled={busy}
            value={view}
            onChange={(e) => {
              setView(e.target.value);
              setPage(0);
              setMessage("");
            }}
          >
            <option value="standings">Clasificación</option>
            <option value="results">Resultados oficiales</option>
          </select>
        </label>
        <label htmlFor="export-page">
          Página de la imagen
          <select
            id="export-page"
            value={current}
            disabled={busy}
            onChange={(e) => setPage(Number(e.target.value))}
          >
            {Array.from({ length: pages }, (_, i) => (
              <option key={i} value={i}>
                Página {i + 1} de {pages}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-tabs">
        <button
          className="action-link"
          disabled={busy || !rows.length}
          onClick={() => void image("png")}
        >
          Descargar imagen de esta página
        </button>
        <button
          className="trophy-button"
          disabled={busy || !rows.length}
          onClick={() => void image("pdf")}
        >
          Descargar PDF completo
        </button>
        <button
          className="trophy-button"
          disabled={busy || !rows.length}
          onClick={() => {
            download(
              filename + ".csv",
              new Blob([competitionCsv(headers, rows)], {
                type: "text/csv;charset=utf-8",
              }),
            );
            setMessage("CSV completo descargado.");
          }}
        >
          Descargar CSV completo
        </button>
        <button
          className="trophy-button"
          disabled={busy || !rows.length}
          onClick={() => window.print()}
        >
          Imprimir página visible
        </button>
      </div>
      <p role="status">{message}</p>
      <p>
        Solo información pública vigente al abrir esta página. Las descargas no
        cambian si después se corrige un partido. El PDF conserva la composición
        como imágenes; el CSV contiene los valores completos.
      </p>
      {!rows.length ? (
        <p className="admin-surface">
          Todavía no hay datos confirmados para este contenido.
        </p>
      ) : (
        <div
          className="export-preview"
          role="region"
          aria-label="Vista previa de la exportación"
          tabIndex={0}
        >
          <div ref={sheet} className="export-sheet" data-page={current}>
            <p>CHAMPIONS FÚTBOL PROHIBIDO</p>
            <h2>{event.name}</h2>
            <h3>{title}</h3>
            <table>
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(current * 10, (current + 1) * 10).map((r, i) => (
                  <tr key={i}>
                    {r.map((v, j) => (
                      <td key={j}>{v ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <footer>
              Página {current + 1} de {pages} ·{" "}
              {view === "standings"
                ? "GC incluye los goles de sanción indicados en GC adm.; zonas pendientes no resueltas."
                : "Deportivo y administrativo se distinguen en Resolución; los pases no inventan goles."}
              <br />
              champions-futbol-prohibido.vercel.app
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
