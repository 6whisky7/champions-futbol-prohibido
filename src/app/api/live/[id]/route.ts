import { createClient } from "@/lib/supabase/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: e } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(e))
    return Response.json({ error: "Evento inválido" }, { status: 400 });
  const c = await createClient(),
    auth = await c.auth.getUser();
  if (auth.error || !auth.data.user)
    return Response.json({ error: "Acceso requerido" }, { status: 401 });
  const { data, error } = await c.rpc("cfp_live_read", { e });
  if (error)
    return Response.json(
      {
        error: "No se pudo comprobar el acceso o la disponibilidad del evento.",
      },
      { status: error.message.includes("Acceso no asignado") ? 403 : 503 },
    );
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
