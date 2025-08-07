// app/trials/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import ReactPaginate from 'react-paginate';
import { FilterSidebar } from '@/components/trial/FilterSidebar';
import { TrialList } from '@/components/trial/TrialList';
import MapView from '@/components/trial/MapView';
import { ViewToggle } from '@/components/trial/ViewToggle'; // Import the new toggle
import { useTrialStore } from '@/stores/trialStore';
//import { fetchTrials, Trial } from '@/lib/api';
import { fetchTrialsFromApi, Trial } from '@/lib/api-client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TrialsSearchPage() {
  const { filters, pagination, setPagination } = useTrialStore();
  const [debouncedFilters] = useDebounce(filters, 500);

  // ADDED: State to manage the current view mode
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const { data, isLoading, isError, error } = useQuery<{ trials: Trial[], totalCount: number }>({
    queryKey: ['trials', debouncedFilters, pagination],
    queryFn: () => {
      // --- START: Smarter API Call Logic ---
      const apiFilters = { ...debouncedFilters, ...pagination };

      // 1. Only include 'bounds' in the API call if we are in map view.
      //    This prevents sending bbox in list view.
      if (viewMode !== 'map') {
        delete apiFilters.bounds;
      }
      
      // 2. The fetcher in api-client.ts already checks if bounds exist,
      //    so we don't send `bbox=undefined...` anymore.
      return fetchTrialsFromApi(apiFilters);
      // --- END: Smarter API Call Logic ---
    },
    keepPreviousData: true,
  });

  const trials = data?.trials ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / pagination.limit);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setPagination({ page: selected });
    window.scrollTo(0, 0);
  };

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Find a Clinical Trial</h1>
        {/* Render the toggle switch in the header */}
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </header>

      {/* Conditionally render the entire layout based on viewMode */}
      {viewMode === 'list' ? (
        // LIST VIEW LAYOUT
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <FilterSidebar />
          </aside>
          <main className="lg:col-span-3">
            <TrialList trials={trials} isLoading={isLoading} error={error?.message} />
            {!isLoading && trials.length > 0 && (
              <ReactPaginate
                forcePage={pagination.page}
                previousLabel={<ChevronLeft size={18} />}
                nextLabel={<ChevronRight size={18} />}
                pageCount={pageCount}
                onPageChange={handlePageClick}
                containerClassName={'flex justify-center items-center gap-2 mt-8'}
                activeClassName={'bg-purple-600 text-white'}
                pageClassName={'px-3 py-1 rounded-md'}
                previousClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
                nextClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
              />
            )}
          </main>
        </div>
      ) : (
        // MAP VIEW LAYOUT
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" style={{ height: '75vh' }}>
          <div className="lg:col-span-5 flex flex-col h-full">
            <aside>
              <FilterSidebar />
            </aside>
            <main className="mt-6 flex-grow overflow-y-auto">
              {/* In map view, the list shows all results, not just the paginated ones */}
              <TrialList trials={data?.trials ?? []} isLoading={isLoading} error={error?.message} />
            </main>
          </div>
          <div className="lg:col-span-7 h-full">
            <MapView trials={data?.trials ?? []} />
          </div>
        </div>
      )}
    </div>
  );
}