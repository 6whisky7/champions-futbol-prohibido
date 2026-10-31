"use client";
import { useEffect, useState, type RefObject } from "react";
import type { KnockoutMatch } from "@/lib/knockout";
export function BracketConnections({
  container,
  matches,
  tracked,
  target,
}: {
  container: RefObject<HTMLDivElement | null>;
  matches: KnockoutMatch[];
  tracked: Set<string>;
  target: string | null;
}) {
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
    paths: { from: string; to: string; d: string }[];
  }>({ width: 0, height: 0, paths: [] });
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    let frame = 0,
      stopped = false;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (stopped) return;
        const bounds = el.getBoundingClientRect();
        const paths: { from: string; to: string; d: string }[] = [];
        for (const m of matches) {
          const to = el.querySelector<HTMLElement>(`#ko-game-${m.number}`);
          if (!to || !to.offsetWidth) continue;
          const b = to.getBoundingClientRect();
          for (const source of [m.home_source, m.away_source]) {
            const parent = matches.find((x) => x.id === source);
            const from =
              parent &&
              el.querySelector<HTMLElement>(`#ko-game-${parent.number}`);
            if (!from || !from.offsetWidth) continue;
            const a = from.getBoundingClientRect(),
              x1 = a.right - bounds.left + el.scrollLeft,
              x2 = b.left - bounds.left + el.scrollLeft,
              y1 = a.top + a.height / 2 - bounds.top + el.scrollTop,
              y2 = b.top + b.height / 2 - bounds.top + el.scrollTop,
              mid = (x1 + x2) / 2;
            paths.push({
              from: parent!.id,
              to: m.id,
              d: `M${x1},${y1} H${mid} V${y2} H${x2}`,
            });
          }
        }
        const columns = Array.from(
          el.querySelectorAll<HTMLElement>(".ko-column"),
        )
          .filter((n) => n.offsetWidth)
          .map((n) => n.getBoundingClientRect());
        setLayout({
          width: Math.max(
            el.clientWidth,
            ...columns.map((r) => r.right - bounds.left + el.scrollLeft),
          ),
          height: Math.max(
            el.clientHeight,
            ...columns.map((r) => r.bottom - bounds.top + el.scrollTop + 24),
          ),
          paths,
        });
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.querySelectorAll(".ko-match,.ko-column").forEach((n) =>
      observer.observe(n),
    );
    document.fonts.ready.then(update);
    update();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [container, matches]);
  return (
    <svg
      className="bracket-connections"
      width={layout.width}
      height={layout.height}
      aria-hidden="true"
    >
      {layout.paths.map((p) => (
        <path
          key={p.from + "-" + p.to}
          d={p.d}
          data-source={p.from}
          data-target={p.to}
          className={
            target === p.to || (tracked.has(p.from) && tracked.has(p.to))
              ? "is-highlighted"
              : ""
          }
        />
      ))}
    </svg>
  );
}
