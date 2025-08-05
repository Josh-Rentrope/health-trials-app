// components/trials/TrialsClientPage.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Trial, Location } from '@/lib/types';
import { Toolbar } from './Toolbar';
import { TrialList } from './TrialList';
import { TrialsMapView } from './TrialsMapView';

type TrialsClientPageProps = {
  trials: Trial[];
};

export const TrialsClientPage: React.FC<TrialsClientPageProps> = ({ trials }) => {
  const [view, setView] = useState<'list' | 'map'>('list');

  // Memoize the flattened list of locations to prevent re-computation
  const allLocations = useMemo(() => {
    return trials.flatMap(trial => trial.locations);
  }, [trials]);

  return (
    <div>
      <Toolbar 
        view={view} 
        setView={setView} 
        resultCount={trials.length} 
      />
      <div className="mt-6">
        {view === 'list' ? (
          <TrialList trials={trials} />
        ) : (
          <TrialsMapView locations={allLocations} />
        )}
      </div>
    </div>
  );
};