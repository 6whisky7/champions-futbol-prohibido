"use client";
import { useActionState } from "react";
import { requestAccess } from "@/app/admin/actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(requestAccess, { message: "" });
  return <form action={action} className="event-form"><label htmlFor="email">Correo del propietario</label>
    <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required />
    <button className="action-link" disabled={pending}>{pending ? "Enviando…" : "Recibir enlace de acceso"}</button>
    <p role="status">{state.message}</p></form>;
}
