import type { TournamentEvent } from "@/lib/events";
import { eventFormats } from "@/lib/events";
import type { League } from "@/lib/league/types";
import type { Knockout } from "@/lib/knockout";
import { unresolved } from "@/lib/public-matches";
export function adminNextStep(e:TournamentEvent,l:League|null,k:Knockout|null,pending:number,approved:number,privacy:boolean) {
  const href=(section:string)=>`/admin/${section}?evento=${e.id}`,config=`/admin/eventos/${e.id}`;
  if(k?.state==="finished")return {title:"Campeón confirmado",text:"La edición está cerrada. Consulta la plantilla y resolución pública; su historial se conserva.",href:`/eventos/${e.id}`,action:"Ver edición"};
  if(k?.state==="active"){
    const final=k.matches.find(m=>m.round===Math.max(...k.matches.map(m=>m.round)));
    return final?.winner?{title:"Confirmar campeón",text:"La final tiene ganador. Revisa la resolución antes de cerrar definitivamente la edición.",href:href("eliminatorias"),action:"Revisar cierre"}:{title:"Resolver eliminatorias",text:`Quedan ${k.matches.filter(m=>!m.winner&&m.kind!=="void").length} cruces sin ganador. Los destinos están fijados.`,href:href("eliminatorias"),action:"Consultar cuadro"};
  }
  if(l?.state==="closed")return {title:k?.state==="preview"?"Revisar el cuadro guardado":"Preparar eliminatorias",text:"La clasificación final está conservada. Preparar y confirmar el cuadro son pasos separados; no se incorporan equipos de espera.",href:href("eliminatorias"),action:"Ir al cuadro"};
  if(l?.state==="active"){
    const remaining=l.matches.filter(m=>unresolved(m.kind)).length;
    return remaining?{title:"Completar la liguilla",text:`Quedan ${remaining} partidos por resolver oficialmente. El marcador de trabajo no sustituye estos resultados.`,href:href("resultados"),action:"Revisar resultados"}:{title:l.table.some(r=>r.tie_pending)?"Resolver los desempates finales":"Cerrar la clasificación",text:"Todos los encuentros están resueltos. Revisa posiciones y sorteos pendientes antes del cierre explícito.",href:href("clasificacion"),action:"Revisar clasificación"};
  }
  if(l?.state==="preview")return {title:"Revisar y confirmar calendario",text:"El sorteo está guardado como revisión privada. Comprueba participantes, rivales y jornadas; confirmarlo los fija.",href:href("calendario"),action:"Revisar calendario"};
  if(e.status==="draft")return {title:"Revisar y publicar el borrador",text:"El evento todavía es privado. Comprueba formato, fechas y cupo; publicar no abre inscripciones.",href:config,action:"Configurar evento"};
  if(pending)return {title:"Completar la revisión de equipos",text:`Hay ${pending} ${pending===1?"solicitud pendiente que ocupa":"solicitudes pendientes que ocupan"} plaza. Confirma al capitán y los requisitos; el sorteo permanece bloqueado mientras haya pendientes.`,href:`/admin/solicitudes?evento=${e.id}&vista=pending`,action:"Revisar solicitudes"};
  if(e.registration_status==="open")return {title:"Cerrar cuando estén listos los equipos",text:`Hay ${approved} aprobados. El formato exige al menos ${eventFormats[e.format].minimum} y un número par. Revisa antes de cerrar: no se promueve automáticamente desde espera.`,href:config,action:"Revisar inscripciones"};
  if(l?.readiness?.ready)return {title:"Preparar la revisión del calendario",text:"Las inscripciones están cerradas y se cumplen las comprobaciones previas. Revisa el sorteo antes de confirmarlo.",href:href("calendario"),action:"Preparar calendario"};
  if(approved)return {title:"Resolver la preparación del sorteo",text:l?.readiness?.reasons.join(" · ")||"Comprueba mínimos, participantes y cierre. No se alteran equipos para completar el formato.",href:href("calendario"),action:"Ver bloqueos"};
  if(!privacy)return {title:"Completar privacidad antes de abrir",text:"Faltan conservación, participación de menores y aviso definitivo. La apertura está bloqueada hasta aprobar y activar su versión.",href:"/privacidad",action:"Consultar lo pendiente"};
  return {title:"Abrir inscripciones",text:"El evento está publicado y cerrado. Abre cuando estés listo para recibir solicitudes y revisar requisitos.",href:config,action:"Configurar apertura"};
}
