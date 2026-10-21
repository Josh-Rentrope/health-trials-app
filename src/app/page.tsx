// app/page.tsx -- the landing page.
//
// `getAllTrials` and `TrialsClientPage` used to be imported here and never
// rendered: the mock trial data and the client page that came with it. Both are
// gone, along with the rest of the mock detail route.
import { Hero } from '@/components/landing/Hero';
import { Stats } from '@/components/landing/Stats';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TrustAndSafety } from '@/components/landing/TrustAndSafety';
import { Testimonials } from '@/components/landing/Testimonials';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800">
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <TrustAndSafety />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
