import { notFound } from "next/navigation";
import { publicObs } from "@/lib/obs-public";
import { ObsCanvas } from "@/components/obs-canvas";
export const metadata = {
  title: "CFP · Vista para OBS",
  robots: { index: false, follow: false },
};
export default async function ObsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; view: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, view } = await params,
    raw = await searchParams,
    query = new URLSearchParams();
  for (const key of ["partido", "pagina", "ronda"])
    if (typeof raw[key] === "string") query.set(key, raw[key]);
  const data = await publicObs(id, view, query);
  if (!data) notFound();
  return <ObsCanvas initial={data} query={query.toString()} />;
}
