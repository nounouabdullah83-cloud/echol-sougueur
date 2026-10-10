import { features } from '../../pages/landingpage/landingData'

const paths = {
  staff:
    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0H4Z',
  book: 'M5 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H5V4Zm14 0h-6a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h6V4Z',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-1 12-3-3 1.5-1.5L11 12l4.5-4.5L17 9l-6 6Z',
  chart: 'M4 20h16M6 16v-5m5 5V7m5 9v-8',
}

function FeatureIcon({ name }) {
  return (
    <svg
      className="lp-feature__icon"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
    >
      <path
        d={paths[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Features() {
  return (
    <section className="lp-section" id="about" aria-labelledby="lp-features-title">
      <div className="lp-container">
        <p className="lp-eyebrow">لماذا نحن</p>
        <h2 className="lp-section__title" id="lp-features-title">
          تعليم يبني الإنسان لا الدرجات فقط
        </h2>

        <div className="lp-features">
          {features.map((item) => (
            <article className="lp-feature" key={item.title}>
              <FeatureIcon name={item.icon} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
