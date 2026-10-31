"use client";
import { useEffect, useState } from "react";
import { knockoutDate as eventDate } from "@/lib/knockout";
export function ExpiryTime({ at }: { at: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      if (!document.hidden) setNow(Date.now());
    };
    tick();
    const timer = setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  const minutes =
    now === null
      ? null
      : Math.max(0, Math.ceil((Date.parse(at) - now) / 60000));
  return (
    <time dateTime={at} className="expiry-time">
      {minutes === null
        ? "Vence"
        : minutes === 0
          ? "Plazo cumplido · pendiente de actualizar"
          : `Vence en ${Math.floor(minutes / 60)} h ${minutes % 60} min`}{" "}
      · {eventDate(at)}
    </time>
  );
}
