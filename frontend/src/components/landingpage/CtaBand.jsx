import { cta } from '../../pages/landingpage/landingData'

export default function CtaBand() {
  return (
    <section className="lp-cta" aria-labelledby="lp-cta-title">
      <div className="lp-container lp-cta__inner">
        <div>
          <h2 id="lp-cta-title">{cta.title}</h2>
          <p>{cta.description}</p>
        </div>
        <a className="lp-btn lp-btn--light" href={cta.button.href}>
          {cta.button.label}
        </a>
      </div>
    </section>
  )
}
