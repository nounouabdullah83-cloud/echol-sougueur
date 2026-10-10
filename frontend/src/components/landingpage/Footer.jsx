import { Link } from 'react-router-dom'

import { brand, footer } from '../../pages/landingpage/landingData'
import Logo from './Logo'

export default function Footer() {
  const { contact, links, hours } = footer

  return (
    <footer className="lp-footer" id="contact">
      <div className="lp-container lp-footer__grid">
        <div className="lp-footer__brand">
          <a className="lp-brand lp-brand--light" href="#home" aria-label={brand.name}>
            <Logo />
            <span className="lp-brand__text">
              <strong>{brand.name}</strong>
              <small>{brand.tagline}</small>
            </span>
          </a>
          <p>{footer.about}</p>
        </div>

        <div className="lp-footer__col">
          <h3>{contact.title}</h3>
          <ul>
            <li>{contact.address}</li>
            <li>
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          </ul>
        </div>

        <div className="lp-footer__col">
          <h3>{links.title}</h3>
          <ul>
            {links.items.map((item) =>
              item.href.startsWith('/') ? (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ) : (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="lp-footer__col">
          <h3>{hours.title}</h3>
          <p>{hours.value}</p>
        </div>
      </div>

      <div className="lp-footer__bottom">
        <div className="lp-container">
          <p>
            © {new Date().getFullYear()} {brand.name}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}
