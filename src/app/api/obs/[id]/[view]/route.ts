import { publicObs } from "@/lib/obs-public";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; view: string }> },
) {
  const { id, view } = await params;
  try {
    const data = await publicObs(id, view, new URL(request.url).searchParams);
    return data
      ? Response.json(data, { headers: { "Cache-Control": "no-store" } })
      : Response.json(
          { error: "Datos públicos no disponibles" },
          { status: 404 },
        );
  } catch {
    return Response.json(
      { error: "No se pudo actualizar la vista pública" },
      { status: 503 },
    );
  }
}
