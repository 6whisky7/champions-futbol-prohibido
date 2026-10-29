import Link from "next/link";

export default function NotFound() {
  return <main className="not-found page-width"><p className="eyebrow">FUERA DE LA CANCHA</p><h1>Esta página no existe.</h1><p>Vuelve al inicio para conocer el torneo y explorar los escudos.</p><Link className="button button-primary" href="/">Volver al inicio</Link></main>;
}
