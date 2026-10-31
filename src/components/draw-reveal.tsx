"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
export function DrawReveal({
  matches,
  preview = false,
}: {
  matches: { id: string; phase: string; homeName: string; awayName: string }[];
  preview?: boolean;
}) {
  const [visible, setVisible] = useState(matches.length),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let stopped = false,
      timer: ReturnType<typeof setTimeout> | undefined,
      count = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const advance = () => {
      if (stopped) return;
      if (reduced.matches) {
        setVisible(matches.length);
        setPlaying(false);
        return;
      }
      if (!document.hidden) {
        count++;
        setVisible(Math.min(count, matches.length));
      }
      if (count >= matches.length) setPlaying(false);
      else timer = setTimeout(advance, 350);
    };
    timer = setTimeout(advance, 350);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [playing, matches.length]);
  return (
    <section className="admin-surface draw-reveal">
      <h2>Revelación del calendario guardado</h2>
      <p>
        {preview
          ? "Revisión privada: todavía no confirmada."
          : "Calendario confirmado."}{" "}
        Esta presentación reproduce los cruces existentes. No vuelve a sortear
        ni cambia rivales.
      </p>
      <div className="admin-tabs">
        <Button
          disabled={playing || !matches.length}
          onClick={() => {
            if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
              setVisible(matches.length);
              return;
            }
            setVisible(0);
            setPlaying(true);
          }}
        >
          Reproducir revelación guardada
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setVisible(matches.length);
          }}
        >
          Mostrar todos los cruces
        </Button>
      </div>
      <p role="status">
        {playing
          ? `Revelando ${visible} de ${matches.length} cruces guardados`
          : `${matches.length} cruces conservados`}
      </p>
      <ol className="draw-reveal-list">
        {matches.slice(0, visible).map((m) => (
          <li key={m.id}>
            <span>{m.phase}</span>
            <strong>
              {m.homeName} contra {m.awayName}
            </strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
