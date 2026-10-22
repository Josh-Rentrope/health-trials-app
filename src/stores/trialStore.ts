// stores/trialStore.ts
import { create } from 'zustand';

import { ViewState } from 'react-map-gl/mapbox';
// Type-only, so this does not create a runtime cycle with the data layer.
import type { Trial } from '@/lib/api-client';

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

  /**
   * The reader's own position, if they allowed it. Used to show "3.2 mi" on a
   * card instead of a city name -- a distance is a decision, a city is trivia.
   * Null until geolocation resolves or is refused, in which case cards fall back
   * to the city.
   */
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void;

  isCollapsed?: boolean; // New prop to control collapsed state
  setCollapsed?: (collapsed: boolean) => void; // N

  setFilters: (newFilters: Partial<FilterState>) => void;
  setPagination: (newPagination: Partial<TrialState['pagination']>) => void;

  setViewMode: (mode: ViewMode) => void;
  setMapViewState: (viewState: Partial<ViewState>) => void;
  resetFilters: () => void;

  /**
   * A trial the user asked the map to show — set by double-clicking a result
   * card. The map watches this, flies to the trial's first placed location and
   * opens its popup, then clears it.
   *
   * It lives in the store rather than in props because the card and the map are
   * in different branches of the tree, and only one of them is mounted at a
   * time (the list and map views are mutually exclusive).
   */
  focusTrial: Trial | null;
  setFocusTrial: (trial: Trial | null) => void;
}

const initialFilters: FilterState = {
  condition: '',
  location: '',
  status: [],
  phase: [],
  correlationCondition: '',
  demographicVariable: '',
  
  
};

export const useTrialStore = create<TrialState>((set) => ({
  filters: {
    condition: '',
    location: '',
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

  focusTrial: null,
  setFocusTrial: (trial) => set({ focusTrial: trial }),

  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc }),
}));