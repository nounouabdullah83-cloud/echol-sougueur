import { hero } from '../../pages/landingpage/landingData'
import HeroArt from './HeroArt'

export default function Hero() {
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-container lp-hero__inner">
        <div className="lp-hero__content">
          <p className="lp-eyebrow">{hero.eyebrow}</p>
          <h1 id="lp-hero-title">{hero.title}</h1>
          <p className="lp-lead">{hero.subtitle}</p>
          <div className="lp-hero__actions">
            <a className="lp-btn" href={hero.primaryCta.href}>
              {hero.primaryCta.label}
            </a>
            <a className="lp-btn lp-btn--outline" href={hero.secondaryCta.href}>
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="lp-hero__art">
          <HeroArt />
        </div>
      </div>
    </section>
  )
}
