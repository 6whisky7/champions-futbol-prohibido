import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { publicCompetition } from "@/lib/public-competition";
import { eventFormats } from "@/lib/events";
export const alt="Edición de Champions Fútbol Prohibido";
export const size={width:1200,height:630};
export const contentType="image/png";
export default async function EventPreview({params}:{params:Promise<{id:string}>}) {
  const {id}=await params,d=await publicCompetition(id);
  if(!d)notFound();
  const font=await readFile(path.join(process.cwd(),"node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff"));
  const poster=await readFile(path.join(process.cwd(),"public/trofeo/cfp-v03-poster.webp"));
  return new ImageResponse(<div style={{display:"flex",width:"100%",height:"100%",background:"#020612",color:"#f3f6fc",padding:48,fontFamily:"Barlow",alignItems:"center",gap:56}}><div style={{display:"flex",flexDirection:"column",width:720,gap:24}}><div style={{fontSize:30,color:"#a7ceff"}}>CHAMPIONS FÚTBOL PROHIBIDO</div><div style={{fontSize:d.event.name.length>60?48:76,wordBreak:"break-word"}}>{d.event.name}</div><div style={{fontSize:38}}>{`${eventFormats[d.event.format].label} · ${d.event.capacity} plazas`}</div><div style={{fontSize:28,color:"#b5c3d9"}}>Partidos, equipos y clasificación de la edición</div></div>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`data:image/webp;base64,${poster.toString("base64")}`} alt="" width={320} height={480}/></div>,{...size,fonts:[{name:"Barlow",data:font,weight:700,style:"normal"}],headers:{"Cache-Control":"no-store"}});
}
