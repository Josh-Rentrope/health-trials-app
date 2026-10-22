// app/page.tsx -- the landing page.
//
// The order tells the story: what this is, the numbers, how the funnel works,
// what the claims mean, and the questions that stop people from calling a study
// team. The testimonial section is deliberately gone: the quotes it carried were
// invented, and fabricated patient testimonials have no place on a health tool.
import { Hero } from '@/components/landing/Hero';
import { Stats } from '@/components/landing/Stats';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TrustAndSafety } from '@/components/landing/TrustAndSafety';
import { Faq } from '@/components/landing/Faq';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="bg-canvas text-ink">
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <TrustAndSafety />
        <Faq />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
