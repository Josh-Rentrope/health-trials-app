// stores/trialStore.ts
import { create } from 'zustand';

import { ViewState } from 'react-map-gl/mapbox'; 

export interface BoundingBox {
  sw: { lng: number; lat: number };
  ne: { lng: number; lat: number };
}

export interface FilterState {
  condition: string;
  location: string;
  status: string[];
  phase: string[];
  bounds?: BoundingBox;
}

interface TrialState {
  filters: FilterState;
  pagination: {
    page: number; // 0-indexed for react-paginate
    limit: number;
  };

  mapViewState: Partial<ViewState>;

  setFilters: (newFilters: Partial<FilterState>) => void;
  setPagination: (newPagination: Partial<TrialState['pagination']>) => void;

  setMapViewState: (viewState: Partial<ViewState>) => void;
}

export const useTrialStore = create<TrialState>((set) => ({
  filters: {
    condition: '',
    location: 'United States',
    status: [],
    phase: [],
  },
  pagination: {
    page: 0,
    limit: 50, // Set how many trials your API should return per page
  },

  mapViewState: {
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5,
  },

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setPagination: (newPagination) =>
    set((state) => ({ pagination: { ...state.pagination, ...newPagination } })),
  
  setMapViewState: (viewState) => set({ mapViewState: viewState }),
}));