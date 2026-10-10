import { courses } from '../../pages/landingpage/landingData'

export default function Courses() {
  return (
    <section className="lp-section" aria-labelledby="lp-courses-title">
      <div className="lp-container">
        <p className="lp-eyebrow">المقررات</p>
        <h2 className="lp-section__title" id="lp-courses-title">
          مواد أساسية ومهارات حديثة
        </h2>

        <div className="lp-courses">
          {courses.map((item) => (
            <article className="lp-course" key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
