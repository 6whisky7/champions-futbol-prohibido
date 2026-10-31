import { ParticipationAction } from "@/components/participation-action";
import { TrophyShowcase } from "@/components/trophy-showcase";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CrestGallery } from "@/components/crest-gallery";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  crestCategories,
  crests,
  featuredCrestIds,
} from "@/lib/crests";
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" tabIndex={-1}>
        <section
          className="hero page-width"
          id="inicio"
          aria-labelledby="hero-title"
        >
          <div className="hero-copy">
            <h1 id="hero-title">
              <span>Champions</span>
              <span> Fútbol Prohibido</span>
            </h1>
              <p className="hero-description">
                Torneo de Fútbol Prohibido en Roblox. Tres jugadores por equipo,
                de la liguilla a la final.
              </p>
              <ParticipationAction />
              <a className="plain-link" href="#escudos">Explorar los escudos <ArrowRight aria-hidden="true" /></a>
              <a className="plain-link" href="#torneo">Conocer el torneo <ArrowRight aria-hidden="true" /></a>
            </div>
          <TrophyShowcase />
        </section>

        <section
          className="gallery-section"
          id="escudos"
          tabIndex={-1}
          aria-labelledby="gallery-title"
        >
          <div className="page-width">
            <div className="section-intro">
              <h2 id="gallery-title">Escudos para tu equipo</h2>
              <p>
                48 diseños originales. Busca por club de inspiración, país o
                número de diseño.
              </p>
            </div>
            <CrestGallery
              crests={crests}
              categories={crestCategories}
              featuredIds={featuredCrestIds}
            />
            <p className="gallery-note">
              Los nombres de clubes indican la inspiración de cada diseño.
            </p>
          </div>
        </section>

        <section
          className="tournament-section page-width"
          id="torneo"
          tabIndex={-1}
          aria-labelledby="tournament-title"
        >
          <div className="section-intro">
            <h2 id="tournament-title">Así se juega el torneo</h2>
            <p>
              Empiezas en la liguilla. Clasificas a las eliminatorias. Compites
              por llegar a la final.
            </p>
          </div>
          <ol className="competition-route" aria-label="Recorrido del torneo">
            <li>
              <h3>Liguilla</h3>
              <p>
                Rivales distintos y la misma cantidad de partidos para cada
                equipo.
              </p>
              <strong>Victoria: 3 puntos</strong>
            </li>
            <li>
              <h3>Eliminatorias</h3>
              <p>Los equipos clasificados se enfrentan a partido único.</p>
              <strong>Cada cruce decide el pase</strong>
            </li>
            <li>
              <h3>Final</h3>
              <p>Los dos finalistas juegan por el campeonato.</p>
              <strong>Un partido por la copa</strong>
            </li>
          </ol>
          <div className="format-detail" id="formato" tabIndex={-1}>
            <div>
              <h3>
                Lo que debes saber
                <br />
                antes de jugar
              </h3>
              <p>
                Un capitán organiza a su equipo. Cada evento anuncia sus
                horarios y su formato.
              </p>
            </div>
            <dl className="match-rules">
              <div>
                <dt>Tu plantilla</dt>
                <dd>3 titulares y 1 suplente opcional.</dd>
              </div>
              <div>
                <dt>El partido</dt>
                <dd>5 minutos. Si hay empate, decide el siguiente gol.</dd>
              </div>
              <div>
                <dt>La ventaja</dt>
                <dd>Con 4 goles de diferencia, termina el partido.</dd>
              </div>
              <div>
                <dt>Tu número</dt>
                <dd>
                  Del 01 al 99. Es opcional y puede repetirse entre equipos.
                </dd>
              </div>
            </dl>
          </div>
          <div className="rule-questions">
            <details>
              <summary>¿Puede llegar tarde el tercer titular?</summary>
              <p>
                Sí. Si el equipo empezó con dos, el tercer titular inscrito
                puede entrar después, siempre que no haya sido reemplazado por
                el suplente.
              </p>
            </details>
            <details>
              <summary>¿Qué pasa si ambos finalistas faltan?</summary>
              <p>
                La final se reprograma una vez. Si ambos vuelven a faltar, será
                campeón el mejor clasificado de la liguilla que siga habilitado.
              </p>
            </details>
            <details>
              <summary>¿A qué hora se juega?</summary>
              <p>
                La referencia es 8:00 p. m., hora de Costa Rica. El horario de
                cada evento se comunica por separado.
              </p>
            </details>
          </div>
        </section>

        <section
          className="community-section"
          id="comunidad"
          tabIndex={-1}
          aria-labelledby="community-title"
        >
          <div className="page-width community-inner">
            <div>
              <h2 id="community-title">
                Sigue el torneo
                <br />
                en TikTok.
              </h2>
              <p>
                Encuentra a la comunidad en{" "}
                <strong translate="no">@whiskyzc</strong> y acompaña los
                partidos.
              </p>
              <p>Ver el LIVE, comentar y dar tap tap es voluntario.</p>
            </div>
            <a
              className="action-link"
              href="https://www.tiktok.com/@whiskyzc"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ir a la comunidad <ArrowUpRight aria-hidden="true" />
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
