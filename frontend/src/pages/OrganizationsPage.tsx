import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import OrganizationsSection from '../components/OrganizationsSection'

export default function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <OrganizationsSection />
      </main>
      <Footer />
    </div>
  )
}
