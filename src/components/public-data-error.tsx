"use client";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export default function PublicDataError({retry}:{retry:()=>void}) {
  return <><SiteHeader/><main className="management-page page-width"><h1>No pudimos consultar la competición</h1><p>Puede ser un problema temporal de conexión. Vuelve a intentar antes de asumir que no hay eventos o resultados.</p><div className="admin-tabs"><button className="action-link" onClick={retry}>Volver a intentar</button><Link href="/eventos">Consultar eventos</Link></div></main><SiteFooter/></>;
}
