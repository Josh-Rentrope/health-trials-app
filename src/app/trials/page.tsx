// app/trials/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import ReactPaginate from 'react-paginate';
import { FilterSidebar } from '@/components/trial/FilterSidebar';
import { TrialList } from '@/components/trial/TrialList';
import { ViewToggle } from '@/components/trial/ViewToggle';
import { useTrialStore } from '@/stores/trialStore';
import { fetchTrialsFromApi, StudyFilters, Trial } from '@/lib/api-client';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// The inline chatbot that used to live here is gone. It was rendered nowhere
// (its usage was commented out) yet it still imported `react-chatbotify` at
// module scope in a client component that gets prerendered, which is the classic
// "window is not defined during prerender" break -- and it pulled in Clerk's
// `useAuth` for a token it never used. The real assistant is at /chat.

const MapViewCSR = dynamic(() => import('@/components/trial/MapView'), {
  ssr: false, 
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      <p className="ml-2 text-gray-600">Loading Map...</p>
    </div>
  ),
});


export default function TrialsSearchPage() {
  const { filters, pagination, setPagination, setMapViewState, mapViewState, setFocusTrial } =
    useTrialStore();
  const setUserLocation = useTrialStore((s) => s.setUserLocation);
  const [debouncedFilters] = useDebounce(filters, 500);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  // --- New state to control sidebar collapse ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Ask for the reader's position once, so cards can say "3.2 mi" instead of a
  // city name. It is requested, never required: a refusal leaves `userLocation`
  // null and every card falls back to the city. No permission prompt on load
  // blocking anything, and no location sent to the API.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => setUserLocation(null),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  }, [setUserLocation]);

  const { data, isLoading, error } = useQuery<{ trials: Trial[], totalCount: number }>({
    queryKey: ['trials', debouncedFilters, pagination, viewMode],
    queryFn: () => {
      const apiFilters: StudyFilters = { ...debouncedFilters, ...pagination };
      if (viewMode !== 'map') {
        // Bounds are only meaningful in map view; sending them from the list
        // view would silently narrow the list to the last map viewport.
        delete apiFilters.bounds;
      }
      return fetchTrialsFromApi(apiFilters);
    },
    // v5 renamed this option: `keepPreviousData: true` is now
    // `placeholderData: keepPreviousData` (the imported helper). Setting the old
    // key was a type error and a silent no-op at runtime, so paging through
    // results flashed the empty state on every page.
    placeholderData: (previous) => previous,
  });

  // Keep showing the last successful results when a request fails.
  //
  // `placeholderData` covers the normal case (a refetch that errors keeps the
  // previous data), but it does not cover a *new* query key that errors -- change
  // a filter while offline and the query has no previous value, so `data` is
  // undefined and the list would blank out on the user mid-read. This ref holds
  // the last thing that actually rendered, and the banner below says so plainly
  // rather than pretending the results are current.
  const lastGood = useRef<{ trials: Trial[]; totalCount: number } | undefined>(undefined);
  if (data) lastGood.current = data;

  const trials = data?.trials ?? lastGood.current?.trials ?? [];
  const totalCount = data?.totalCount ?? lastGood.current?.totalCount ?? 0;
  const showingStale = !!error && !!lastGood.current;
  const pageCount = Math.ceil(totalCount / pagination.limit);

  // Double-clicking a card: show the map, fly to that trial's first placed
  // location and open its popup. The map itself does the flying -- this only
  // records the intent in the store.
  const handleFocusTrial = (trial: Trial) => {
    const loc = trial.locations?.[0];
    if (!loc) return;
    setViewMode('map');
    setMapViewState({ ...mapViewState, latitude: loc.latitude, longitude: loc.longitude, zoom: 12 });
    setFocusTrial(trial);
  };

  const handlePageClick = ({ selected }: { selected: number }) => {
    setPagination({ page: selected });
    window.scrollTo(0, 0);
  };

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">Find a Clinical Trial</h1>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </header>

      {showingStale && (
        <div className="mb-4 rounded-md border border-warn bg-warn-soft px-4 py-2 text-[13px] text-warn">
          <span className="font-medium">Connection lost</span> — showing the last
          results that loaded. They may be out of date.
          {error?.message ? (
            <span className="ml-1 opacity-70">({error.message})</span>
          ) : null}
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            {/* Pass props for map view functionality, but they won't be used here */}
            <FilterSidebar isLoading={isLoading} isCollapsed={false} />
          </aside>
          <main className="lg:col-span-3">
            {!isLoading && trials.length > 0 && (
              <ReactPaginate
                forcePage={pagination.page}
                previousLabel={<ChevronLeft size={18} />}
                nextLabel={<ChevronRight size={18} />}
                pageCount={pageCount}
                onPageChange={handlePageClick}
                containerClassName={'flex justify-center items-center gap-2 mb-6'}
                activeClassName={'bg-accent text-white'}
                pageClassName={'px-3 py-1 rounded-md'}
                previousClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
                nextClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
              />
            )}
            <TrialList trials={trials} isLoading={isLoading} error={error?.message}
                       onFocus={handleFocusTrial} />
            {!isLoading && trials.length > 0 && (
              <ReactPaginate
                forcePage={pagination.page}
                previousLabel={<ChevronLeft size={18} />}
                nextLabel={<ChevronRight size={18} />}
                pageCount={pageCount}
                onPageChange={handlePageClick}
                containerClassName={'flex justify-center items-center gap-2 mt-8'}
                activeClassName={'bg-accent text-white'}
                pageClassName={'px-3 py-1 rounded-md'}
                previousClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
                nextClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
              />
            )}
          </main>
        </div>
      ) : (
        // MAP VIEW LAYOUT
        <div className="relative" style={{ height: '85vh' }}>
          <div className="absolute inset-0 z-0">
            {/* --- Pass handler to collapse sidebar on map move --- */}
            <MapViewCSR onMapMove={() => setIsSidebarCollapsed(true)} />
          </div>

          {/* Overlay for Filters and List */}
          {/* Added pointer-events-none to allow map interaction underneath */}
          <div className="absolute top-0 left-0 z-10 h-full w-full lg:w-[450px] p-4 flex flex-col gap-4 pointer-events-none">
            {/* Re-enable pointer events for the sidebar */}
            <div className="flex-shrink-0 pointer-events-auto">
              {/* --- Pass collapsed state and setter to the sidebar --- */}
              <FilterSidebar
                isCollapsed={isSidebarCollapsed}
                setCollapsed={setIsSidebarCollapsed}
                isLoading={isLoading}
              />
            </div>
            {/* Re-enable pointer events for the list */}
            <main className="flex-grow overflow-y-auto bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg pointer-events-auto">
              <TrialList trials={trials} isLoading={isLoading} error={error?.message}
                         onFocus={handleFocusTrial} />
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
