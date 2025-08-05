// app/page.tsx
import Image from 'next/image';
import {
  MapPin, User, Stethoscope, FlaskConical, Award,
  Group, Rocket, HeartPulse, Globe
} from 'lucide-react';
import InfoPill from '@/components/InfoPill';
import KeyInfoItem from '@/components/KeyInfoItem';
import ApplySidebar from '@/components/ApplySidebar';
import FaqSection from '@/components/FaqSection';
import React from 'react';

const Header: React.FC = () => (
  <header className="py-4 border-b border-gray-200">
    <div className="container mx-auto flex justify-between items-center px-4">
      <div className="text-2xl font-bold text-purple-700">V Power</div>
      {/* Add other nav items here */}
    </div>
  </header>
);

const SearchBar: React.FC = () => (
    <div className="py-3 border-b border-gray-200">
        <p className="text-gray-500"><span className="font-medium text-gray-700">Search</span> | Anal Carcinoma</p>
    </div>
)

export default function TrialPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <SearchBar />
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12 mt-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            
            {/* Trial Header */}
            <section className="flex flex-col sm:flex-row gap-6 items-start">
              <Image
                src="/profile-placeholder.png" // Ensure this exists in /public
                alt="Trial illustration"
                width={80}
                height={80}
                className="rounded-full border-4 border-white shadow-md"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Nivolumab for Anal Cancer</h1>
                <p className="text-gray-600 mt-1">Recruiting in Lexington (+10 mi) • 1017 other locations</p>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <InfoPill icon={User} text="Age: 18+" />
                  <InfoPill icon={Stethoscope} text="Sex: Any" />
                  <InfoPill icon={FlaskConical} text="Trial Phase: Phase 3" highlight={true} />
                  <InfoPill icon={Award} text="Sponsor: National Cancer Institute (NCI)" />
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold">Must not be taking:</span> checkpoint inhibitors, immunosuppressants</p>
                    <p><span className="font-semibold">Disqualifiers:</span> Pregnancy, Transplant, Autoimmune disease, others</p>
                </div>
              </div>
            </section>

            {/* Key Information Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 p-6 bg-white rounded-lg border border-gray-200">
                <KeyInfoItem icon={Group} title="No Placebo Group">
                    All trial participants will receive the active study treatment (no placebo).
                </KeyInfoItem>
                <KeyInfoItem icon={Rocket} title="Pivotal Trial (Near Approval)">
                    This treatment is in the last trial phase before FDA approval.
                </KeyInfoItem>
                <KeyInfoItem icon={HeartPulse} title="Prior Safety Data">
                    This treatment has passed at least one previous human trial.
                </KeyInfoItem>
                <KeyInfoItem icon={Globe} title="Breakthrough Therapy">
                   This drug has been fast-tracked for approval by the FDA given its high promise.
                </KeyInfoItem>
            </section>

            <FaqSection />

          </div>

          {/* Sidebar */}
          <div className="mt-10 lg:mt-0">
            <ApplySidebar />
          </div>

        </div>
      </main>
    </div>
  );
}