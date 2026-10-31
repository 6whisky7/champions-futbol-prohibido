import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { publicCompetition } from "@/lib/public-competition";
import { unresolved, classificationZone } from "@/lib/public-matches";
import { getCrest } from "@/lib/crests";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export default async function TeamPage({params}:{params:Promise<{id:string;team:string}>}) {
  const {id,team:teamId}=await params,d=await publicCompetition(id);
  if(!d)notFound();
  const snapshot=d.knockout?.teams.find(t=>t.id===teamId), current=d.teams.find(t=>t.id===teamId);
  if(!snapshot&&!current)notFound();
  const team=snapshot??current!,row=d.league?.table?.find(t=>t.id===teamId),matches=d.matches.filter(m=>m.home===teamId||m.away===teamId),results=matches.filter(m=>!unresolved(m.kind)),zone=row&&d.league?classificationZone(row,d.league):null;
  return <><SiteHeader/><main className="management-page page-width"><Link href={`/eventos/${id}`}>Volver a {d.event.name}</Link><div className="team-heading"><Image src={getCrest(team.crest).src} alt="Escudo del equipo" width={144} height={144}/><div><h1>{team.name}</h1><p>{snapshot?`Clasificado de liguilla: ${snapshot.seed}.º`:current?.state==="approved"?"Equipo aprobado":"Solicitud pendiente de revisión"}</p>{row&&<p>{row.position}.º · {row.points} puntos <span className={`zone-label zone-${zone?.key}`}>{zone?.label}</span></p>}</div></div>
    <section className="admin-surface"><h2>Plantilla Roblox</h2><p>Se muestra la plantilla oficial conservada al confirmar el cuadro, cuando exista.</p><ul className="public-roster">{team.members.map((m,i)=><li key={m.roblox}><strong translate="no">{m.roblox}</strong><span>{snapshot?(snapshot.members[i].role==="Suplente"?"Suplente":"Titular"):(i===3?"Suplente":"Titular")}{(snapshot?snapshot.members[i].captain:String(i)===current?.captain)?" · Capitán":""}</span></li>)}</ul></section>
    <section className="admin-surface"><h2>Últimos resultados</h2><p>Últimos cinco encuentros resueltos, en orden de competición. V: victoria; D: derrota; N: nulo o sin ganador. Las resoluciones administrativas se indican aparte.</p><div className="form-streak">{results.slice(-5).map(m=><Link key={m.id} href={`/eventos/${id}/partidos/${m.id}`} className="trophy-button">{m.winner===teamId?"V":m.winner?"D":"N"}{m.kind!=="sport"?" · Adm.":""}<span className="sr-only"> · {m.homeName} contra {m.awayName}</span></Link>)}</div>{!results.length&&<p>Todavía no hay resultados oficiales.</p>}</section>
    <section><h2>Partidos</h2><ul className="public-match-list">{matches.map(m=><li key={m.id}><div><p className="eyebrow">{m.phase}</p><h3>{m.homeName} contra {m.awayName}</h3><p>{unresolved(m.kind)?"Por jugar":m.hg===null?"Sin goles asignados":`${m.hg} – ${m.ag}`}{!unresolved(m.kind)&&m.kind!=="sport"?" · Administrativo":""}</p></div><Link href={`/eventos/${id}/partidos/${m.id}`}>Ver partido</Link></li>)}</ul>{!matches.length&&<p>El equipo todavía no tiene partidos confirmados.</p>}</section>
  </main><SiteFooter/></>;
}
