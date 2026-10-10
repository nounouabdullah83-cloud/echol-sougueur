import { stats } from '../../pages/landingpage/landingData'

export default function Stats() {
  return (
    <section className="lp-stats" aria-label="أرقام المدرسة">
      <div className="lp-container lp-stats__grid">
        {stats.map((item) => (
          <div className="lp-stat" key={item.label}>
            <span className="lp-stat__value">{item.value}</span>
            <span className="lp-stat__label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
