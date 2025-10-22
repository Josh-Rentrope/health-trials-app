// stores/trialStore.ts
import { create } from 'zustand';

import { ViewState } from 'react-map-gl/mapbox'; 

export interface BoundingBox {
  sw: { lng: number; lat: number };
  ne: { lng: number; lat: number };
}

// --- NEW: Define the possible view modes ---
export type ViewMode = 'trials' | 'correlation';

export interface FilterState {
  condition: string;
  location: string;
  status: string[];
  phase: string[];
  bounds?: BoundingBox;
  correlationCondition?: string;
  demographicVariable?: string; // e.g., 'v021_raw_value'
}

interface TrialState {
  filters: FilterState;
  pagination: {
    page: number; // 0-indexed for react-paginate
    limit: number;
  };

  viewMode: ViewMode;
  mapViewState: Partial<ViewState>;

  isCollapsed?: boolean; // New prop to control collapsed state
  setCollapsed?: (collapsed: boolean) => void; // N

  setFilters: (newFilters: Partial<FilterState>) => void;
  setPagination: (newPagination: Partial<TrialState['pagination']>) => void;

  setViewMode: (mode: ViewMode) => void;
  setMapViewState: (viewState: Partial<ViewState>) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  condition: '',
  location: 'United States',
  status: [],
  phase: [],
  correlationCondition: '',
  demographicVariable: '',
  
  
};

export const useTrialStore = create<TrialState>((set) => ({
  filters: {
    condition: '',
    location: 'United States',
    status: [],
    phase: [],
    correlationCondition:"",
    demographicVariable:"",
  },
  pagination: {
    page: 0,
    limit: 50, // Set how many trials your API should return per page
  },
  isCollapsed:false,
  viewMode: 'trials', // Default to trials view
  mapViewState: {
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5,
  },

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setPagination: (newPagination) =>
    set((state) => ({ pagination: { ...state.pagination, ...newPagination } })),
  
  setCollapsed: (mode) => set( {isCollapsed:mode} ),

  setViewMode: (mode) => set({ viewMode: mode }),
  setMapViewState: (viewState) => set({ mapViewState: viewState }),
  resetFilters: () => set({ filters: initialFilters }),
}));