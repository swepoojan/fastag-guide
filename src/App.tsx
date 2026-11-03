import { useState } from 'react'
import type { ProviderId } from './data/providers'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Wizard from './components/Wizard'
import Compare from './components/Compare'
import Passes from './components/Passes'
import HowItWorks from './components/HowItWorks'
import WhyUs from './components/WhyUs'
import Faq from './components/Faq'
import FinalCta from './components/FinalCta'
import Footer from './components/Footer'

export default function App() {
  const [compareIds, setCompareIds] = useState<ProviderId[]>([])
  const [myBank, setMyBank] = useState<ProviderId | null>(null)

  const toggleCompare = (id: ProviderId) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  return (
    <>
      <a href="#find" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Skip to the assistant
      </a>
      <Nav />
      <main>
        <Hero />
        <Wizard compareIds={compareIds} onToggleCompare={toggleCompare} onBankChange={setMyBank} />
        <HowItWorks />
        <Compare compareIds={compareIds} onToggleCompare={toggleCompare} myBank={myBank} onBankChange={setMyBank} />
        <Passes />
        <WhyUs />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
