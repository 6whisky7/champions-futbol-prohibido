import Image from "next/image";
import { ArrowIcon } from "@/components/arrow-icon";
import { CrestGallery } from "@/components/crest-gallery";
import { crestCategories, crests, featuredCrestIds, getCrest } from "@/lib/crests";

const heroCrests = ["45", "11", "41", "46", "12", "36"].map(getCrest);

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="site-header page-width">
        <a className="wordmark" href="#inicio" aria-label="Champions Fútbol Prohibido, inicio">
          <span className="brand-emblem" aria-hidden="true">✦</span>
          <span>CHAMPIONS<span className="wordmark-subtitle">FÚTBOL PROHIBIDO</span></span>
        </a>
        <nav aria-label="Navegación principal" className="main-nav">
          <a href="#torneo">El torneo</a>
          <a href="#escudos">Los escudos</a>
          <a href="#formato">Cómo se juega</a>
        </nav>
        <a className="header-link" href="#escudos">Explorar escudos <ArrowIcon diagonal /></a>
      </header>

      <main id="contenido">
        <section className="hero page-width" id="inicio" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="live-dot" /> FÚTBOL PROHIBIDO · ROBLOX</p>
            <h1 id="hero-title">CHAMPIONS<span> FÚTBOL</span><span className="title-light"> PROHIBIDO</span></h1>
            <p className="hero-description">La copa se juega en equipo. Reúne a los tuyos y recorre el camino de la liguilla a la gran final.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#torneo">Conoce el torneo <ArrowIcon /></a>
              <a className="text-link" href="#escudos">Encuentra tu escudo <ArrowIcon diagonal /></a>
            </div>
            <div className="hero-community"><span className="community-line" /> Una cancha. Toda una comunidad.</div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="pitch-orbit orbit-one" />
            <div className="pitch-orbit orbit-two" />
            <div className="hero-art-label"><span className="small-star">✦</span> IDENTIDAD DE EQUIPO</div>
            <div className="hero-crest-board">
              {heroCrests.map((crest, index) => (
                <div className={`hero-crest hero-crest-${index + 1}`} key={crest.id}>
                  <span className="hero-crest-label">DISEÑO {crest.id}</span>
                  <Image src={crest.src} alt="" width={220} height={220} sizes="(max-width: 600px) 28vw, 170px" loading={index < 3 ? "eager" : "lazy"} />
                </div>
              ))}
            </div>
            <div className="hero-art-caption"><span className="caption-number">48</span><span>ESCUDOS ORIGINALES<br />TU EQUIPO, TU IDENTIDAD</span></div>
          </div>
        </section>

        <div className="tournament-facts page-width" aria-label="El torneo en tres datos">
          <div><span className="fact-number">3<span>+1</span></span><p>Titulares por equipo<span>Un suplente opcional</span></p></div>
          <div><span className="fact-number">5<span>MIN</span></span><p>Partidos intensos<span>Empate: decide el siguiente gol</span></p></div>
          <div><span className="fact-number">01<span>—99</span></span><p>Un número para tu equipo<span>Opcional y puede repetirse</span></p></div>
        </div>

        <section className="tournament-section page-width section-space" id="torneo" aria-labelledby="tournament-title">
          <div className="section-heading">
            <div><p className="eyebrow">EL TORNEO</p><h2 id="tournament-title">El talento cuenta.<br /><span className="text-muted">El equipo lo cambia todo.</span></h2></div>
            <p>Champions Fútbol Prohibido reúne a la comunidad para competir en Roblox. La liguilla ordena a los equipos; las eliminatorias deciden quién levanta la copa.</p>
          </div>
          <div className="format-steps" id="formato">
            <article className="format-step"><span className="step-number">01</span><div className="step-mark" aria-hidden="true">↗</div><h3>Forma tu equipo</h3><p>Tres titulares y, si quieren, un suplente. Una plantilla, un capitán y una identidad compartida.</p></article>
            <article className="format-step"><span className="step-number">02</span><div className="step-mark step-mark-grid" aria-hidden="true">▦</div><h3>Gana tu lugar</h3><p>En la liguilla todos juegan la misma cantidad de partidos, frente a rivales distintos. Cada victoria suma tres puntos.</p></article>
            <article className="format-step"><span className="step-number">03</span><div className="step-mark" aria-hidden="true">✦</div><h3>Ve por la copa</h3><p>Una vez clasificados, las eliminatorias son a partido único. Cada cruce acerca a tu equipo a la final.</p></article>
          </div>
          <p className="format-note"><span aria-hidden="true">◷</span> Inicio de referencia: <strong>8:00 p. m., hora de Costa Rica.</strong> Los horarios de cada evento se comunicarán por separado.</p>
        </section>

        <section className="gallery-section section-space" id="escudos" aria-labelledby="gallery-title">
          <div className="page-width">
            <div className="section-heading gallery-heading">
              <div><p className="eyebrow">LA COLECCIÓN</p><h2 id="gallery-title">Tu historia merece<br /><span className="title-light">su propio escudo.</span></h2></div>
              <p>48 diseños originales, inspirados en la tradición del fútbol de diez países y ligas. Explora la colección y encuentra el estilo que representa a los tuyos.</p>
            </div>
            <CrestGallery crests={crests} categories={crestCategories} featuredIds={featuredCrestIds} />
            <p className="gallery-footnote">Los clubes indicados son referencias de inspiración de los diseños.</p>
          </div>
        </section>

        <section className="community-section page-width section-space" aria-labelledby="community-title">
          <div><p className="eyebrow">DENTRO Y FUERA DE LA CANCHA</p><h2 id="community-title">Se juega en Roblox.<br />Se vive en comunidad.</h2><p>Acompaña los partidos, comparte la emoción y apoya a tu equipo. Ver el LIVE, comentar y dar tap tap es apoyo voluntario.</p></div>
          <a className="button button-outline" href="https://www.tiktok.com/@whiskyzc" target="_blank" rel="noopener noreferrer">La comunidad en TikTok<span className="sr-only"> (se abre en otra pestaña)</span><ArrowIcon diagonal /></a>
        </section>
      </main>

      <footer className="site-footer page-width"><a className="footer-brand" href="#inicio">CHAMPIONS <span>FÚTBOL PROHIBIDO</span></a><p>Hecho para jugar en equipo.</p><a href="#inicio">Volver arriba ↑</a></footer>
    </>
  );
}
