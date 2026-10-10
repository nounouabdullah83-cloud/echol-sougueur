import { levels } from '../../pages/landingpage/landingData'

export default function Levels() {
  return (
    <section className="lp-section lp-section--tint" id="programs" aria-labelledby="lp-levels-title">
      <div className="lp-container">
        <p className="lp-eyebrow">المراحل الدراسية</p>
        <h2 className="lp-section__title" id="lp-levels-title">
          من الصف الأول حتى السادس
        </h2>

        <div className="lp-levels">
          {levels.map((item) => (
            <article className="lp-level" key={item.name}>
              <span className="lp-level__number">{item.number}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
