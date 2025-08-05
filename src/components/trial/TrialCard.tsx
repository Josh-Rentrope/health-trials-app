// components/trials/TrialCard.tsx
import React from 'react';
import { Trial } from '@/lib/api'; // Imports our NEW, CLEAN Trial type
import { InfoPill } from '@/components/ui/InfoPill';
import Link from 'next/link';

type TrialCardProps = {
  trial: Trial; // The prop is now a clean, predictable Trial object
};

export const TrialCard: React.FC<TrialCardProps> = ({ trial }) => {
  // Destructuring from our clean `trial` object. No need for optional chaining!

  const { id, title, acronym, status, sponsor, phases } = trial;

  

  const detailUrl = `https://clinicaltrials.gov/study/${id}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="p-6 flex-grow">
        <p className="text-sm text-gray-500">{status}</p>
        <h3 className="text-lg font-bold text-gray-900 mt-1">
          {title} {acronym && `(${acronym})`}
        </h3>
        <p className="text-sm text-gray-600 mt-1 truncate">
          Sponsor: {sponsor}
        </p>

        <div className="flex flex-wrap gap-2 my-4">
          {phases.map(phase => <InfoPill key={phase} text={phase} highlight />)}
        </div>
      </div>
      <div className="p-6 pt-0 border-t border-gray-100 mt-4">
        <Link href={detailUrl} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center font-semibold py-2 px-4 rounded-lg transition-colors duration-200 bg-purple-600 text-white hover:bg-purple-700">
          View Details on ClinicalTrials.gov
        </Link>
      </div>
    </div>
  );
};