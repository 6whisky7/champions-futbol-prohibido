import { publicCompetition } from "@/lib/public-competition";
import { matchCalendar } from "@/lib/calendar";
export async function GET(_r:Request,{params}:{params:Promise<{id:string;match:string}>}) {
  const {id,match}=await params,d=await publicCompetition(id),m=d?.matches.find(x=>x.id===match);
  const body=d&&m&&matchCalendar(d.event,m);
  if(!body)return new Response("No hay un horario válido publicado",{status:404});
  return new Response(body,{headers:{"Content-Type":"text/calendar; charset=utf-8","Content-Disposition":`attachment; filename="cfp-${m!.id}.ics"`,"Cache-Control":"no-store"}});
}
