import Header from '../../components/landingpage/Header'
import Hero from '../../components/landingpage/Hero'
import Stats from '../../components/landingpage/Stats'
import Features from '../../components/landingpage/Features'
import Levels from '../../components/landingpage/Levels'
import Courses from '../../components/landingpage/Courses'
import Faculty from '../../components/landingpage/Faculty'
import CtaBand from '../../components/landingpage/CtaBand'
import Footer from '../../components/landingpage/Footer'
import './landing.css'

export default function LandingPage() {
  return (
    <main className="lp">
      <Header />
      <Hero />
      <Stats />
      <Features />
      <Levels />
      <Courses />
      <Faculty />
      <CtaBand />
      <Footer />
    </main>
  )
}