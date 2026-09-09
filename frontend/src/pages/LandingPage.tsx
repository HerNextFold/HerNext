import Footer from '../components/Footer'
import Hero from '../components/Hero'
import Journey from '../components/Journey'
import Navbar from '../components/Navbar'
import ValueProps from '../components/ValueProps'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <ValueProps />
        <Journey />
      </main>
      <Footer />
    </div>
  )
}
