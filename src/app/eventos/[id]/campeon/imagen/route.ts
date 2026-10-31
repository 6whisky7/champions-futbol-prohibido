import {publicCompetition} from '@/lib/public-competition';
import {resultImage} from '@/lib/result-image';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,d=await publicCompetition(id),c=d?.knockout?.state==='finished'?d.knockout.champion:null;
 const final=d?.matches.find(m=>m.id===c?.final.id);
 if(!d||!c||!final)return new Response('Campeón no disponible',{status:404});
 return resultImage(d.event.name,final,true,{name:c.team.name,crest:c.team.crest});
}
