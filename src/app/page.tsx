// app/trials/page.tsx
import { getAllTrials } from '@/lib/data';
import { TrialsClientPage } from '@/components/trial/TrialsClientPage';

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
