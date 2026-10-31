import { CheckCircle2, AlertCircle, LoaderCircle } from "lucide-react";
export function SaveStatus({
  busy,
  message,
}: {
  busy: boolean;
  message: string;
}) {
  if (!busy && !message) return null;
  const success =
    message === "Guardado." ||
    message === "Fechas guardadas." ||
    message === "Comprobación guardada.";
  return (
    <p
      className="save-status"
      role={busy || success ? "status" : "alert"}
      data-state={busy ? "saving" : success ? "saved" : "error"}
    >
      {busy ? (
        <LoaderCircle aria-hidden="true" />
      ) : success ? (
        <CheckCircle2 aria-hidden="true" />
      ) : (
        <AlertCircle aria-hidden="true" />
      )}
      <span>
        <strong>{busy ? "Guardando…" : success ? "Guardado" : "Error"}</strong>
        {!busy && message !== "Guardado." && <> · {message}</>}
      </span>
    </p>
  );
}
