import { matchLabels } from "@/lib/league/types";
import { knockoutLabels } from "@/lib/knockout";
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const rows=(v:unknown)=>Array.isArray(v)?v.map(object):[];
const states:Record<string,string>={preview:"Revisión previa",active:"En curso",closed:"Liguilla cerrada",finished:"Edición terminada"};
export function CompetitionAuditChanges({before,after,teams}:{before:unknown;after:unknown;teams:{id:string;name:string}[]}){
  const a=object(before),b=object(after),names=[...rows(a.teams),...rows(b.teams),...teams];
  const name=(id:unknown)=>names.find(t=>t.id===id)?.name as string??"Participante por definir";
  const score=(m:Record<string,unknown>)=>["pending","postponed","replay","blocked"].includes(String(m.kind))?"Por jugar":m.hg===null||m.ag===null?"Sin goles asignados":`${m.hg}–${m.ag}`;
  const label=(m:Record<string,unknown>)=>`${score(m)} · ${knockoutLabels[String(m.kind)]??matchLabels[String(m.kind)]??"Resolución registrada"}`;
  const changes:string[]=[];
  if(a.state!==b.state&&b.state)changes.push(`Estado: ${states[String(a.state)]??"Sin fase"} → ${states[String(b.state)]??String(b.state)}`);
  const previous=rows(a.matches),current=rows(b.matches);
  for(const m of current){const old=previous.find(x=>x.id===m.id);if(!old){changes.push(`Nuevo cruce: ${name(m.home)} contra ${name(m.away)}`);continue;}
    if(["kind","hg","ag","home","away","winner","attempt"].some(key=>old[key]!==m[key]))changes.push(`${name(m.home)} contra ${name(m.away)}: ${label(old)} → ${label(m)}`);
    if(old.scheduled_at!==m.scheduled_at){const date=m.scheduled_at?new Date(Date.parse(String(m.scheduled_at))-6*3600000).toISOString().slice(0,16).replace("T"," ")+" · Costa Rica":"Sin fecha";changes.push(`Horario de ${name(m.home)} contra ${name(m.away)}: ${date}`);}
  }
  for(const t of rows(b.teams)){const old=rows(a.teams).find(x=>x.id===t.id);if(old&&old.dq!==t.dq)changes.push(`${name(t.id)}: ${t.dq?"inhabilitado":"habilitado"}`);}
  for(const [key,order] of Object.entries(object(b.lots))){if(JSON.stringify(object(a.lots)[key])!==JSON.stringify(order)&&Array.isArray(order))changes.push(`Orden del desempate guardado: ${order.map(name).join(" → ")}`);}
  if(object(b.champion).team&&JSON.stringify(a.champion)!==JSON.stringify(b.champion))changes.push(`Campeón conservado: ${String(object(object(b.champion).team).name)}`);
  return changes.length?<ul className="competition-change-list">{changes.map((s,i)=><li key={i}>{s}</li>)}</ul>:null;
}
