import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { crests } from "@/lib/crests";
import type { PublicMatch } from "@/lib/public-matches";

export async function resultImage(eventName: string, match: PublicMatch, vertical: boolean) {
  const font = await readFile(path.join(process.cwd(), "node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff"));
  const crest = async (id: string | null) => id && crests.some(c => c.id === id) ? `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public/escudos-mini", id + ".png"))).toString("base64")}` : null;
  const images = await Promise.all([crest(match.homeCrest), crest(match.awayCrest)]);
  const w = vertical ? 1080 : 1200, h = vertical ? 1920 : 630;
  const scored = match.hg !== null && match.ag !== null;
  return new ImageResponse(<div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",width:"100%",height:"100%",background:"#020612",color:"#f3f6fc",padding:vertical?80:44,fontFamily:"Barlow",fontWeight:700,borderTop:"12px solid #a7ceff"}}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{fontSize:vertical?38:24,color:"#a7ceff"}}>CHAMPIONS FÚTBOL PROHIBIDO</div><div style={{fontSize:eventName.length>60?(vertical?48:32):(vertical?64:42),wordBreak:"break-word"}}>{eventName}</div><div style={{fontSize:vertical?32:24,color:"#b5c3d9"}}>{match.phase}</div></div>
    <div style={{display:"flex",flexDirection:vertical?"column":"row",alignItems:"center",justifyContent:"space-around",gap:vertical?40:24}}>
      {[0,1,2].map(i => i===1 ? <div key={i} style={{fontSize:vertical?150:96,color:"#a7ceff"}}>{scored ? `${match.hg} – ${match.ag}` : "SIN GOLES"}</div> : <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,width:vertical?"100%":350,textAlign:"center"}}>
        {/* Catalog-owned images only; no arbitrary URL fetches. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {images[i===0?0:1] && <img src={images[i===0?0:1]!} alt="" width={vertical?220:120} height={vertical?220:120}/>}
        <span style={{fontSize:(i===0?match.homeName:match.awayName).length>35?(vertical?48:30):(vertical?68:42),wordBreak:"break-word"}}>{i===0?match.homeName:match.awayName}</span></div>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{fontSize:vertical?38:26}}>{match.kind === "sport" ? "RESULTADO DEPORTIVO OFICIAL" : "RESOLUCIÓN ADMINISTRATIVA · NO ES RÉCORD DEPORTIVO"}</div><div style={{fontSize:vertical?28:22,color:"#b5c3d9"}}>champions-futbol-prohibido.vercel.app</div></div>
  </div>,{width:w,height:h,fonts:[{name:"Barlow",data:font,weight:700,style:"normal"}],headers:{"Cache-Control":"no-store",...(vertical?{"Content-Disposition":`attachment; filename="cfp-resultado-${match.id}.png"`}:{})}});
}
