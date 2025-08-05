// components/trial/TrialHeader.tsx
import React from 'react';
import { Trial } from '@/lib/types';
import { InfoPill } from '@/components/ui/InfoPill';
import { Stethoscope, User, FlaskConical, Building } from 'lucide-react';

type TrialHeaderProps = {
  trial: Trial;
};

export const TrialHeader: React.FC<TrialHeaderProps> = ({ trial }) => {
  return (
    <header className="pb-6">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-sm font-semibold text-purple-600 uppercase">
            {trial.recruitingStatus}
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-1">
            {trial.title}
          </h1>
        </div>
        {/* A logo could go here */}
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <InfoPill icon={User} text={`Age: ${trial.eligibility.age}`} />
        <InfoPill icon={Stethoscope} text={`Sex: ${trial.eligibility.sex}`} />
        <InfoPill icon={FlaskConical} text={`Phase ${trial.phase}`} highlight />
        <InfoPill icon={Building} text={`Sponsor: ${trial.sponsor}`} />
      </div>
    </header>
  );
};