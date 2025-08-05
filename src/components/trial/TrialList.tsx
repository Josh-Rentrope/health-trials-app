// components/trials/TrialList.tsx
import React from 'react';
import { Trial } from '@/lib/api'; // Use our clean Trial type
import { TrialCard } from './TrialCard';

type TrialListProps = {
  trials: (Trial | null)[]; // The array might contain nulls before filtering
  isLoading: boolean;
  error: string | null;
};

// A placeholder for loading state
const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
    <div className="h-10 bg-gray-300 rounded w-full"></div>
  </div>
);

export const TrialList: React.FC<TrialListProps> = ({ trials, isLoading, error }) => {
  if (error) {
    return <div className="p-6 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const validTrials = trials.filter(Boolean); // A simple way to remove any null/undefined items

  if (validTrials.length === 0) {
    return <div className="p-6 bg-gray-50 text-gray-700 rounded-lg">No trials found matching your criteria.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {validTrials.map((trial) => (
        // THE FIX:
        // 1. The key uses the reliable 'trial.id'.
        // 2. The prop is correctly named 'trial'.
        <TrialCard key={trial?.id} trial={trial} />
      ))}
    </div>
  );
};