import { create } from 'zustand';
import { ViewState } from 'react-map-gl';

// Interface for a single trial location, based on the document's schema [cite: 102-133]
interface TrialLocation {
  location_text: string;
  latitude: number;
  longitude: number;
  census_tract_id?: string | null;
  demographics?: object | null;
}

// Interface for a single trial, based on the document's schema [cite: 59, 66-139]
interface Trial {
  nct_number: string;
  study_title: string;
  study_url: string;
  status: string;
  conditions: string[];
  phase: string;
  enrollment_count?: number | null;
  locations?: TrialLocation[];
  internal_metadata?: object | null;
}

// Interface defining the entire store's state and its actions
interface TrialState {
  // Data State
  trials: Trial[];
  totalTrials: number;
  isLoading: boolean;
  error: string | null;

  // UI Interaction State [cite: 364]
  mapViewState: ViewState;
  hoveredTrialId: string | null;
  selectedTrialId: string | null;
  
  // Actions
  setApiData: (data: { data: Trial[], total: number }) => void;
  setLoading: () => void;
  setError: (error: string) => void;
  setMapViewState: (viewState: ViewState) => void;
  setHoveredTrialId: (id: string | null) => void;
  setSelectedTrialId: (id: string | null) => void;
}

export const useTrialStore = create<TrialState>((set) => ({
  // Initial Data State [cite: 346-350]
  trials: [],
  totalTrials: 0,
  isLoading: false,
  error: null,

  // Initial UI Interaction State [cite: 366-371, 378, 379]
  mapViewState: {
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5,
    pitch: 0,
    bearing: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  hoveredTrialId: null,
  selectedTrialId: null,

  // Actions implementation
  setApiData: (data) => set({
    trials: data.data,
    totalTrials: data.total,
    isLoading: false,
    error: null,
  }),
  setLoading: () => set({ isLoading: true, error: null }),
  setError: (error) => set({ isLoading: false, error: error }),
  setMapViewState: (viewState) => set({ mapViewState: viewState }),
  setHoveredTrialId: (id) => set({ hoveredTrialId: id }),
  setSelectedTrialId: (id) => set({ selectedTrialId: id }),
}));