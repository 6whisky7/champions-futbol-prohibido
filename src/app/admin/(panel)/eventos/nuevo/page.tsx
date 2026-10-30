import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { EventForm } from "@/components/event-form";
export default async function NewEvent() {
  await requireOwner();
  return (
    <main className="admin-editor">
      <Link href="/admin/eventos">← Eventos</Link>
      <EventForm />
    </main>
  );
}
