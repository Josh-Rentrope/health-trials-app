// app/trials/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import ReactPaginate from 'react-paginate';
import { FilterSidebar } from '@/components/trial/FilterSidebar';
import { TrialList } from '@/components/trial/TrialList';
import MapView from '@/components/trial/MapView';
import { ViewToggle } from '@/components/trial/ViewToggle';
import { useTrialStore } from '@/stores/trialStore';
import { fetchTrialsFromApi, Trial } from '@/lib/api-client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ChatBot, { Flow } from 'react-chatbotify';
import dynamic from 'next/dynamic';
import { useAuth } from '@clerk/nextjs';

const TrialAssistantChatbot = () => {
    const { getToken } = useAuth();
    const { filters, setFilters } = useTrialStore();

    const handleSearchAction = async ({ userInput }: { userInput: string }) => {
        const input = userInput.toLowerCase();
        if (input.includes("phase 1")) setFilters({ phase: ["PHASE_1"] });
        else if (input.includes("phase 2")) setFilters({ phase: ["PHASE_2"] });
        else if (input.includes("recruiting")) setFilters({ status: ["RECRUITING"] });
        else if (input.includes("california")) setFilters({ location: "California" });
        else {
            setFilters({ condition: userInput });
        }
    };

    const flow: Flow = {
        start: {
            message: "Hello! I'm your trial search assistant. How can I help you find a clinical trial today?",
            path: "query_loop",
        },
        query_loop: {
            message: () => {
                const condition = filters.condition;
                if (condition) {
                    return `I see you are looking for trials related to "${condition}". You can ask me to "show recruiting trials" or "find trials in California".`;
                }
                return "You can ask me to find trials for a condition, status, or location.";
            },
            path: "process_query",
        },
        process_query: {
            user: true,
            action: handleSearchAction,
            path: "query_loop",
        },
    };

    return <ChatBot flow={flow} />;
};

const DynamicChatBot = dynamic(() => Promise.resolve(TrialAssistantChatbot), {
    ssr: false,
});


export default function TrialsSearchPage() {
  const { filters, pagination, setPagination } = useTrialStore();
  const [debouncedFilters] = useDebounce(filters, 500);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  // --- New state to control sidebar collapse ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { data, isLoading, isError, error } = useQuery<{ trials: Trial[], totalCount: number }>({
    queryKey: ['trials', debouncedFilters, pagination, viewMode], // Added viewMode to queryKey
    queryFn: () => {
      const apiFilters = { ...debouncedFilters, ...pagination };
      if (viewMode !== 'map') {
        delete apiFilters.bounds;
      }
      return fetchTrialsFromApi(apiFilters);
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
      
      <DynamicChatBot />

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Find a Clinical Trial</h1>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </header>

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
                activeClassName={'bg-purple-600 text-white'}
                pageClassName={'px-3 py-1 rounded-md'}
                previousClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
                nextClassName={'px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
              />
            )}
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
        <div className="relative" style={{ height: '85vh' }}>
          <div className="absolute inset-0 z-0">
            {/* --- Pass handler to collapse sidebar on map move --- */}
            <MapView onMapMove={() => setIsSidebarCollapsed(true)} />
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
              <TrialList trials={trials} isLoading={isLoading} error={error?.message} />
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
