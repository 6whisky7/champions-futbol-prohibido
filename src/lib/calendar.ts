import type { PublicMatch } from "@/lib/public-matches";
const escape = (s: string) => s.replaceAll("\\", "\\\\").replaceAll("\r", "").replaceAll("\n", "\\n").replaceAll(";", "\\;").replaceAll(",", "\\,");
const stamp = (s: string) => new Date(s).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function fold(line: string) {
  const lines: string[] = []; let part = "", bytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    if (bytes + size > 75) { lines.push(part); part = " "; bytes = 1; }
    part += ch; bytes += size;
  }
  return [...lines, part].join("\r\n");
}
export function matchCalendar(event: { id: string; name: string; updated_at: string }, match: PublicMatch, now = new Date()) {
  if (!match.scheduled_at || !Number.isFinite(Date.parse(match.scheduled_at))) return null;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CFP//Partidos//ES", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${event.id}-${match.id}@champions-futbol-prohibido.vercel.app`, `DTSTAMP:${stamp(now.toISOString())}`,
    `DTSTART:${stamp(match.scheduled_at)}`,
    `SUMMARY:${escape(match.homeName + " vs " + match.awayName + " · " + event.name)}`,
    `DESCRIPTION:${escape(match.phase + ". Hora publicada por el organizador. Cinco minutos de juego; empate al siguiente gol. Esta descarga no se sincroniza automáticamente: revisa el sitio si se reprograma.")}`,
    `URL:https://champions-futbol-prohibido.vercel.app/eventos/${event.id}/partidos/${match.id}`,
    "END:VEVENT", "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}
