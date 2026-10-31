import { publicCompetition } from "@/lib/public-competition";
import { unresolved } from "@/lib/public-matches";
import { resultImage } from "@/lib/result-image";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{id:string;match:string}>}) {
  const {id,match}=await params,d=await publicCompetition(id),m=d?.matches.find(x=>x.id===match);
  if(!d||!m||unresolved(m.kind))return new Response("Resultado público no disponible",{status:404});
  return resultImage(d.event.name,m,new URL(request.url).searchParams.get("vertical")==="1");
}
