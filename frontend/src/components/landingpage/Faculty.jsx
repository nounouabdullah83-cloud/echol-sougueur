import { faculty } from '../../pages/landingpage/landingData'

export default function Faculty() {
  return (
    <section className="lp-section lp-section--tint" id="faculty" aria-labelledby="lp-faculty-title">
      <div className="lp-container">
        <p className="lp-eyebrow">الكادر التعليمي</p>
        <h2 className="lp-section__title" id="lp-faculty-title">
          معلمون يعرفون كل طالب باسمه
        </h2>

        <div className="lp-faculty">
          {faculty.map((member) => (
            <article className="lp-teacher" key={member.name}>
              <span className="lp-teacher__avatar" aria-hidden="true">
                {member.name.replace('أ. ', '').charAt(0)}
              </span>
              <h3>{member.name}</h3>
              <p>{member.subject}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
