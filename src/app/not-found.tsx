import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="not-found page-width" tabIndex={-1}>
        <p className="error-number" aria-hidden="true">
          404
        </p>
        <div>
          <h1>No encontramos esta página</h1>
          <p>
            El enlace puede haber cambiado. Vuelve al torneo o explora los
            escudos.
          </p>
          <div className="not-found-actions">
            <Link className="action-link" href="/">
              Volver al inicio <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="plain-link" href="/#escudos">
              Ver los escudos
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
