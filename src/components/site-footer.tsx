import { Brand } from "./brand";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer page-width">
      <Brand />
      <p>
        Fútbol Prohibido en Roblox.
        <br />
        Una competición de la comunidad <span translate="no">@whiskyzc</span>.
      </p>
      <Link href="/privacidad">Privacidad y contacto</Link>
      <Link href="/campeones">Campeones y récords</Link>
      <Link className="footer-top" href="/#inicio">
        Volver arriba
      </Link>
    </footer>
  );
}
