import { Check } from "lucide-react";
import { phases, type PhaseState } from "@/lib/event-phase";
export function PhaseBar({ phase }: { phase: PhaseState }) {
  return (
    <section className="phase-bar" aria-label="Fases del evento">
      <ol>
        {phases.map((label, i) => (
          <li
            key={label}
            aria-current={i === phase.index ? "step" : undefined}
            className={i < phase.index ? "phase-done" : ""}
          >
            {i < phase.index ? (
              <Check aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{i + 1}</span>
            )}
            <span>{label}</span>
          </li>
        ))}
      </ol>
      <p>{phase.context}</p>
    </section>
  );
}
