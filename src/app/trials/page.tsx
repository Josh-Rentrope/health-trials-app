// app/trials/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import ReactPaginate from 'react-paginate';
import { FilterSidebar } from '@/components/trial/FilterSidebar';
import { TrialList } from '@/components/trial/TrialList';
import MapView from '@/components/trial/MapView';
import { ViewToggle } from '@/components/trial/ViewToggle';
import { fetchTrials, FilterState, Trial } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TRIALS_PER_PAGE = 10;

export default function TrialsSearchPage() {
  // State for raw data
  const [allTrials, setAllTrials] = useState<Trial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // State for UI control
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [currentPage, setCurrentPage] = useState(0);

  const handleFilterChange = async (filters: FilterState) => {
    // This function can be expanded later to support API-side pagination
    try {
      setIsLoading(true);
      setError(null);
      const { trials: fetchedTrials, totalCount: fetchedTotal } = await fetchTrials(filters);
      setAllTrials(fetchedTrials);
      setTotalCount(fetchedTotal);
      setCurrentPage(0); // Reset to first page on new search
    } catch (err) {
      setError('Failed to fetch trials. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFilterChange({ condition: '', location: 'United States', status: [], phase: [] });
  }, []);

  // Pagination Logic
  const pageCount = Math.ceil(totalCount / TRIALS_PER_PAGE);
  const offset = currentPage * TRIALS_PER_PAGE;
  const currentTrials = allTrials.slice(offset, offset + TRIALS_PER_PAGE);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Find a Clinical Trial</h1>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </header>

      {/* Conditional Rendering Based on View Mode */}
      {viewMode === 'list' ? (
        // LIST VIEW LAYOUT
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <FilterSidebar onFilterChange={handleFilterChange} isLoading={isLoading} />
          </aside>
          <main className="lg:col-span-3">
            <TrialList trials={currentTrials} isLoading={isLoading} error={error} />
            {!isLoading && allTrials.length > 0 && (
              <ReactPaginate
                previousLabel={<ChevronLeft size={18} />}
                nextLabel={<ChevronRight size={18} />}
                breakLabel={'...'}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                containerClassName={'flex justify-center items-center gap-2 mt-8'}
                pageClassName={'px-3 py-1 rounded-md transition-colors'}
                pageLinkClassName={'font-semibold'}
                previousClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
                nextClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
                activeClassName={'bg-purple-600 text-white'}
                disabledClassName={'opacity-50 cursor-not-allowed'}
              />
            )}
          </main>
        </div>
      ) : (
        // MAP VIEW LAYOUT (the two-panel design)
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-150px)]">
          <div className="lg:col-span-5 flex flex-col h-full">
            <aside>
              <FilterSidebar onFilterChange={handleFilterChange} isLoading={isLoading} />
            </aside>
            <main className="mt-6 flex-grow overflow-y-auto">
              <TrialList trials={allTrials} isLoading={isLoading} error={error} />
            </main>
          </div>
          <div className="lg:col-span-7 h-full">
            <MapView trials={allTrials} />
          </div>
        </div>
      )}
    </div>
  );
}