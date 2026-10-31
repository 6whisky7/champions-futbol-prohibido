import Link from "next/link";
import Image from "next/image";
import { publicCompetition, publishedEvents } from "@/lib/public-competition";
import { sportingRecords } from "@/lib/public-matches";
import { getCrest } from "@/lib/crests";
import { eventDate } from "@/lib/events";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const dynamic="force-dynamic";
export const metadata={title:"Campeones y récords | Champions Fútbol Prohibido"};
export default async function Champions(){
  const editions=await publishedEvents();
  // Bound concurrency while retaining every published edition (no silent top-N records).
  const data: Awaited<ReturnType<typeof publicCompetition>>[]=[];
  for(let i=0;i<editions.length;i+=8)data.push(...await Promise.all(editions.slice(i,i+8).map(e=>publicCompetition(e.id))));
  const champions=data.filter(d=>d?.knockout?.champion),matches=data.flatMap(d=>d?.matches??[]),records=sportingRecords(matches);
  function recordList(items:typeof records.margin){return <ul className="public-match-list">{items.map(m=>{const d=data.find(d=>d?.matches.some(x=>x.id===m.id))!;return <li key={m.id}><div><h3>{m.homeName} {m.hg}–{m.ag} {m.awayName}</h3><p>{d.event.name} · {m.phase}</p></div><Link href={`/eventos/${d.event.id}/partidos/${m.id}`}>Ver resultado</Link></li>;})}</ul>;}
  return <><SiteHeader/><main className="management-page page-width"><h1>Campeones y récords</h1><p>Ediciones publicadas y resultados oficiales. No se mezclan goleadas deportivas con ausencias, abandonos, pases ni sanciones administrativas.</p>
    <section><h2>Campeones por edición</h2><ul className="public-match-list">{champions.map(d=>{const c=d!.knockout!.champion!;return <li key={d!.event.id}><Image src={getCrest(c.team.crest).src} alt="" width={88} height={88}/><div><p className="eyebrow">{c.event_name}</p><h3>{c.team.name}</h3><p>Cierre: {eventDate(c.closed_at)}</p><p>{c.final.kind==="sport"?"Final deportiva":"Final con resolución administrativa"}</p></div><Link href={`/eventos/${d!.event.id}`}>Ver edición</Link></li>;})}</ul>{!champions.length&&<div className="admin-surface"><h3>La historia empieza en la cancha</h3><p>Todavía no hay un campeón confirmado de una edición publicada.</p><Link href="/eventos">Consultar eventos</Link></div>}</section>
    <section><h2>Récords deportivos</h2><p>Se consideran {records.count} encuentros con tipo «deportivo», de liguillas y cuadros confirmados de todas las ediciones publicadas. Se muestran todos los empates del récord vigente. Una corrección oficial recalcula esta página; los 100 GC de sanción nunca se interpretan como goles de un partido.</p>{records.count?<><h3>Mayor diferencia de goles</h3>{recordList(records.margin)}<h3>Más goles en un encuentro</h3>{recordList(records.goals)}</>:<p className="admin-surface">Todavía no hay partidos deportivos oficiales para calcular récords.</p>}</section>
  </main><SiteFooter/></>;
}
