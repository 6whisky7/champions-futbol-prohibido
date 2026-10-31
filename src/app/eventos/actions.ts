"use server";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationPayload } from "@/lib/applications";
export async function submitApplication(e:string,p:ApplicationPayload,k:string,waiting:boolean,acceptance?:{accepted:boolean;version:string}) {
  if (acceptance?.accepted !== true || !/^[A-Za-z0-9._-]{1,64}$/.test(acceptance.version)) return {error:"Lee y acepta el aviso de privacidad vigente antes de enviar."};
  if (!/^[a-f0-9-]{36}$/i.test(e) || !/^[a-f0-9-]{36}$/i.test(k) || typeof waiting!=="boolean") return {error:"Solicitud inválida."};
  const secret=process.env.CFP_SUBMISSION_HMAC_KEY;
  if (!secret || secret.length<32) return {error:"La recepción de solicitudes está pendiente de configuración."};
  const h=await headers();
  // Vercel overwrites this header. Never accept a client-provided fingerprint.
  const ip=(h.get(process.env.VERCEL==="1"?"x-vercel-forwarded-for":"x-forwarded-for")??"").split(",")[0].trim();
  if (!isIP(ip)) return {error:"No se pudo validar la conexión. Conserva tus datos y reintenta."};
  if (!p || typeof p !== "object" || Array.isArray(p)) return {error:"Solicitud inválida."};
  const raw_payload=JSON.stringify(p);
  if (Buffer.byteLength(raw_payload)>6000) return {error:"Revisa la longitud de los datos."};
  const issued=Math.floor(Date.now()/1000);
  const client_digest=createHmac("sha256",secret).update("client\n"+new Date().toISOString().slice(0,10)+"\n"+ip).digest("hex");
  const policy_version=acceptance.version;
  const message=[e.toLowerCase(),k.toLowerCase(),String(issued),client_digest,waiting?"1":"0",raw_payload,policy_version].join("\n");
  const proof=createHmac("sha256",secret).update(message).digest("hex");
  const c=await createClient();
  const {data,error}=await c.rpc("cfp_submit_application_secure",{e,k,raw_payload,waiting,issued,client_digest,policy_version,proof});
  if(error) return {error:"No se pudo guardar la solicitud. Conserva tus datos y reintenta; si continúa, contacta al organizador."};
  return data as {error?:string;result?:{id:string;state:string;expires_at:string|null}};
}
