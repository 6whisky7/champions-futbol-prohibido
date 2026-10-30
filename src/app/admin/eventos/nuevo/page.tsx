import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { EventForm } from "@/components/event-form";
export default async function NewEvent() {
  await requireOwner();
  return <main className="management-page page-width"><Link href="/admin">← Eventos</Link><h1>Crear evento</h1><EventForm /></main>;
}
