import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { signOut } from "@/app/admin/actions";
export const dynamic = "force-dynamic";
export default async function Access({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  return <main className="management-page page-width"><Link href="/">← Volver al inicio</Link><h1>Acceso del propietario</h1>
    <p>Solo el propietario puede gestionar los eventos. Los visitantes no necesitan una cuenta.</p>
    {estado && <p role="alert">{estado === "sin-permiso" ? "Esta cuenta no tiene permisos administrativos." : "El enlace no es válido o ha vencido. Solicita uno nuevo."}</p>}
    <LoginForm /><form action={signOut}><button className="trophy-button">Cerrar sesión</button></form></main>;
}
