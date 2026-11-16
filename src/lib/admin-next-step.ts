import type { TournamentEvent } from "@/lib/events";
import type { League } from "@/lib/league/types";
import type { Knockout } from "@/lib/knockout";
import { unresolved } from "@/lib/public-matches";

export const adminPhases = [
  "Preparar evento", "Inscripciones y equipos", "Calendario y liguilla",
  "Clasificación final", "Cuartos de final", "Semifinales", "Final y campeón",
];

export function adminNextStep(event: TournamentEvent & { roster_locked: boolean }, league: League | null, knockout: Knockout | null, registrationsEnabled: boolean) {
  const href = (section: string) => "/admin/" + section + "?evento=" + event.id;
  const approved = league?.readiness?.participants ?? 0;
  const required = league?.readiness?.qualified ?? event.capacity;
  const config = "/admin/eventos/" + event.id + "#event-settings";
  const step = (phase: number, text: string, action?: string, url?: string) => ({ phase, text, action, href: url });
  if (event.status === "finished") return step(7, "El torneo ha terminado.", "Ver campeón", href("eliminatorias") + "#ko-final");
  if (knockout?.state === "finished") return step(6, "El campeón está confirmado. Ya puedes finalizar el evento.", "Finalizar evento", "/admin/eventos/" + event.id + "#event-lifecycle");
  if (knockout?.state === "active") {
    const last = Math.max(...knockout.matches.map((m) => m.round));
    const next = knockout.matches.filter((m) => !m.winner && m.kind !== "void").sort((a, b) => a.round - b.round)[0];
    if (!next) return step(6, "La final tiene un ganador.", "Confirmar campeón", href("eliminatorias") + "#ko-final");
    const phase = next.round === last ? 6 : next.round === last - 1 ? 5 : 4;
    const label = phase === 6 ? "la final" : phase === 5 ? "las semifinales" : event.format === "quarters" ? "los cuartos de final" : "las eliminatorias";
    return step(phase, "El cuadro está confirmado. Continúa con " + label + ".", "Continuar con " + label, href("eliminatorias"));
  }
  if (league?.state === "closed") {
    const stage = event.format === "quarters" ? "cuartos de final" : "eliminatorias";
    return knockout?.state === "preview"
      ? step(4, "Revisa los emparejamientos antes de fijarlos.", "Revisar emparejamientos", href("eliminatorias"))
      : step(4, "La clasificación final está confirmada.", "Preparar " + stage, href("eliminatorias"));
  }
  if (league?.state === "active") {
    const next = league.matches.filter((m) => unresolved(m.kind)).sort((a, b) => a.round - b.round)[0];
    if (!next) return step(3, league.table.some((r) => r.tie_pending)
      ? "Todos los partidos de liguilla están finalizados. Quedan desempates por resolver."
      : "Todos los partidos de liguilla están finalizados.",
    "Revisar clasificación final", href("clasificacion"));
    const round = league.matches.filter((m) => m.round === next.round);
    const played = round.filter((m) => !unresolved(m.kind)).length;
    return step(2, "Jornada " + next.round + ": " + played + " de " + round.length + " partidos jugados.",
      "Registrar resultados", href("calendario") + "&jornada=" + next.round);
  }
  if (league?.state === "preview")
    return step(2, "El calendario está listo para revisar.", "Revisar y confirmar calendario", href("calendario"));
  if (event.status === "draft")
    return step(0, "Revisa el nombre, la fecha y el formato antes de publicar el evento.", "Revisar configuración", config);
  if (league?.readiness?.ready)
    return step(2, "Los " + league.readiness.participants + " equipos están listos.", "Preparar calendario", href("calendario"));
  if (event.registration_status === "open") {
    if (approved >= required)
      return step(1, "Ya hay " + approved + " equipos aprobados. Revisa y cierra las inscripciones cuando estén listos.", "Revisar y cerrar inscripciones", config);
    return step(1, "Hay " + approved + " equipos aprobados. Revisa las solicitudes para completar los equipos.", "Revisar solicitudes", href("solicitudes"));
  }
  if (!event.roster_locked) return registrationsEnabled
    ? step(1, "El evento está publicado. Abre las inscripciones cuando estés listo para recibir solicitudes.", "Configurar inscripciones", config)
    : step(1, "Revisa la configuración de privacidad antes de abrir las inscripciones.", "Revisar privacidad", "/admin/privacidad");
  return step(1, "Hay " + approved + " equipos aprobados. Revisa qué falta para preparar el calendario.", "Ver inscripciones y equipos", href("solicitudes"));
}
