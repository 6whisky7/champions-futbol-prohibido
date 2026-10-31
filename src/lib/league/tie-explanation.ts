import type { LeagueRow, LeagueTeam } from "@/lib/league/types";
export function tieExplanation(row:LeagueRow,teams:LeagueTeam[]) {
  const name=(id:string)=>teams.find(t=>t.id===id)?.name??"equipo de la clasificación";
  if(row.dq)return "Excluido · −12 puntos fijos y +100 GC administrativos";
  if(row.tie_pending)return "Desempate pendiente · zona por resolver";
  if(row.tie_reason==="Enfrentamiento directo"&&row.tie_opponent)return `Desempate por duelo directo frente a ${name(row.tie_opponent)}`;
  if(row.tie_reason==="Minitabla de victorias"&&row.tie_mini_teams&&typeof row.tie_mini_wins==="number")return `Minitabla completa entre ${row.tie_mini_teams.map(name).join(", ")}: ${row.tie_mini_wins} victorias de este equipo`;
  if(row.tie_reason==="Sorteo registrado")return "Desempate por sorteo guardado";
  return row.tie_reason??"Puntos";
}
