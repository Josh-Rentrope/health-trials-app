// app/trial/[slug]/page.tsx
import { getTrialBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';
import { TrialHeader } from '@/components/trial/TrialHeader';
import { ApplySidebar } from '@/components/trial/ApplySidebar';
import { EligibilitySection } from '@/components/trial/EligibilitySection';
import { LocationsSection } from '@/components/trial/LocationsSection';
import { FaqSection } from '@/components/trial/FaqSection';
import { TeamSection } from '@/components/trial/TeamSection';
import { Section } from '@/components/ui/Section';

type Props = {
  params: { slug: string };
};

export default async function TrialPage({ params }: Props) {
  const trial = await getTrialBySlug(params.slug);

  if (!trial) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TrialHeader trial={trial} />
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12 mt-8">
        <main className="lg:col-span-2 space-y-12">
          
          <Section title="What to Expect">
            <p className="text-gray-600">{trial.summary}</p>
          </Section>

          <EligibilitySection criteria={trial.eligibility} />
          
          <LocationsSection locations={trial.locations} />

          <FaqSection faqs={trial.faqs} />
          
          <TeamSection team={trial.team} />

        </main>
        <aside className="mt-10 lg:mt-0">
          <ApplySidebar />
        </aside>
      </div>
    </div>
  );
}