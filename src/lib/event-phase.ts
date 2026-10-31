import type { League } from "./league/types";
import type { Knockout } from "./knockout";
export type PhaseState = { index: number; context: string };
export const phases = [
  "Borrador",
  "Publicado",
  "Abiertas",
  "Cerradas",
  "Calendario",
  "Liguilla",
  "Eliminatorias",
  "Campeón",
];
export function eventPhase(
  e: { status: string; registration_status: string; roster_locked?: boolean },
  l: League | null,
  k: Knockout | null,
): PhaseState {
  if (k?.state === "finished")
    return { index: 7, context: "Campeón confirmado · edición cerrada" };
  if (k)
    return {
      index: 6,
      context:
        k.state === "preview"
          ? "Revisión del cuadro · aún no confirmado"
          : "Eliminatorias en curso · destinos fijos",
    };
  if (l?.state === "closed")
    return {
      index: 5,
      context: "Clasificación cerrada · pendiente de preparar eliminatorias",
    };
  if (l?.state === "active")
    return {
      index: 5,
      context: "Liguilla confirmada · resultados oficiales en curso",
    };
  if (l?.state === "preview")
    return {
      index: 4,
      context: "Revisión del calendario · rivales aún por confirmar",
    };
  if (e.status === "draft")
    return {
      index: 0,
      context: "Borrador privado · publicar no abre inscripciones",
    };
  if (e.registration_status === "open")
    return {
      index: 2,
      context: e.roster_locked
        ? "Inscripciones reabiertas · se conserva el cierre previo de plantillas"
        : "Inscripciones abiertas · revisión de equipos",
    };
  return e.roster_locked
    ? {
        index: 3,
        context: "Inscripciones cerradas · revisar pendientes antes del sorteo",
      }
    : { index: 1, context: "Publicado · inscripciones todavía cerradas" };
}
