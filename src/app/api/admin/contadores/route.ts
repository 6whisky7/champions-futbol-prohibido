import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/applications";
import type { League } from "@/lib/league/types";
import type { Knockout } from "@/lib/knockout";
import { unresolved } from "@/lib/public-matches";
export async function GET(request:Request){
  const c=await createClient(),{data:{user},error}=await c.auth.getUser();
  if(error||!user)return Response.json({error:"Acceso requerido"},{status:401});
  const owner=await c.rpc("cfp_is_owner");if(owner.error||owner.data!==true)return Response.json({error:"Acceso denegado"},{status:403});
  const e=new URL(request.url).searchParams.get("evento");if(!e||!/^[a-f0-9-]{36}$/i.test(e))return Response.json({error:"Evento inválido"},{status:400});
  const [a,l,k]=await Promise.all([c.rpc("cfp_admin_applications",{e}),c.rpc("cfp_league_read",{e,admin:true}),c.rpc("cfp_knockout_read",{e,admin:true})]);
  if(a.error||l.error||k.error)return Response.json({error:"No se pudieron consultar los contadores"},{status:503});
  const items=(a.data??[]) as Application[],league=l.data as League|null,ko=k.data as Knockout|null;
  return Response.json({evento:e,pending:items.filter(x=>x.state==="pending").length,approved:items.filter(x=>x.state==="approved").length,waiting:items.filter(x=>x.state==="waiting").length,results:(league?.matches??[]).filter(x=>unresolved(x.kind)).length+(ko?.matches??[]).filter(x=>!x.winner&&x.kind!=="void").length},{headers:{"Cache-Control":"no-store"}});
}
