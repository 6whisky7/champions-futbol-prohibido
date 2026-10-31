import { Progress } from "./ui/progress";
export function Occupancy({
  pending,
  approved,
  capacity,
}: {
  pending: number;
  approved: number;
  capacity: number;
}) {
  const used = pending + approved;
  return (
    <section className="occupancy" aria-label="Ocupación del evento">
      <div>
        <h2>Plazas ocupadas</h2>
        <strong>
          {used} de {capacity}
        </strong>
      </div>
      <Progress
        value={capacity ? Math.min(100, (used / capacity) * 100) : 0}
        aria-label="Plazas ocupadas por pendientes y aprobados"
        aria-valuetext={`${used} de ${capacity} plazas`}
      />
      <p>
        {pending} pendientes y {approved} aprobados ocupan plaza. La espera no
        reserva.
      </p>
    </section>
  );
}
