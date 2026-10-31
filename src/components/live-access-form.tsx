"use client";
import { useActionState } from "react";
import { requestLiveAccess } from "@/app/live/actions";
export function LiveAccessForm() {
  const [state, action, pending] = useActionState(requestLiveAccess, {
    message: "",
  });
  return (
    <form action={action} className="event-form">
      <label htmlFor="live-email">Correo de tu cuenta verificada</label>
      <input
        id="live-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
      />
      <button className="action-link" disabled={pending}>
        {pending ? "Solicitando enlace…" : "Solicitar enlace de acceso"}
      </button>
      <p role="status">{state.message}</p>
      <p>
        No se crean cuentas desde esta pantalla. La asignación por evento no
        convierte al ayudante en administrador.
      </p>
    </form>
  );
}
