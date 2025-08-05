// app/trials/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FilterSidebar } from '@/components/trial/FilterSidebar';
import { TrialList } from '@/components/trial/TrialList';
import { fetchTrials, FilterState, Trial } from '@/lib/api'; // Import clean Trial type


export default function TrialsSearchPage() {
  const [trials, setTrials] = useState<Trial[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const handleFilterChange = async (filters: FilterState) => {
    try {
      setIsLoading(true);
      setError(null);
      const { trials: fetchedTrials, totalCount: fetchedTotal } = await fetchTrials(filters);
      setTrials(fetchedTrials);
      setTotalCount(fetchedTotal);
    } catch (err) {
      setError('Failed to fetch trials. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    handleFilterChange({
      condition: '',
      location: 'United States',
      status: [],
      phase: [],
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <FilterSidebar onFilterChange={handleFilterChange} isLoading={isLoading} />
        </aside>
        <main className="lg:col-span-3">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Clinical Trials</h2>
            <p className="text-gray-600">
              {isLoading ? 'Searching for trials...' : `Showing ${trials.length} of ${totalCount} results`}
            </p>
          </div>
          <TrialList trials={trials} isLoading={isLoading} error={error} />
        </main>
      </div>
    </div>
  );
}