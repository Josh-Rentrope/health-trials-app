// lib/api-client.ts

import { FilterState } from './api';

// --- 1. Define the RAW data structure from our new FastAPI backend ---
export interface StudyLocation {
  location_text: string;
  latitude: number;
  longitude: number;
}

export interface ApiStudy {
  nct_number: string;
  study_title: string;
  study_url: string;
  status?: string;
  conditions?: string;
  phase?: string;
  enrollment_count?: number;
  locations: StudyLocation[];
}

export interface PaginatedApiResponse {
  total: number;
  page: number;
  limit: number;
  data: ApiStudy[];
}

// --- 2. Define our App's CLEAN & RELIABLE data structure (already in api.ts) ---
export interface Trial {
  id: string;
  title: string;
  acronym: string | null;
  status: string;
  sponsor: string;
  phases: string[];
  locations?: { latitude: number; longitude: number }[];
}

// --- 3. The Normalizer Function: To transform API data into our app's data structure ---
function normalizeApiStudy(study: ApiStudy): Trial | null {
  if (!study || !study.nct_number || !study.study_title) {
    return null;
  }

  // Helper to format status strings (e.g., "RECRUITING" -> "Recruiting")
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return {
    id: study.nct_number,
    title: study.study_title,
    acronym: null, // The new API doesn't provide an acronym
    status: study.status ? formatStatus(study.status) : 'Unknown',
    sponsor: 'Sponsor from DB', // The new API doesn't provide a sponsor, so we'll need to decide on a placeholder
    phases: study.phase ? study.phase.split('|').map(p => `Phase ${p.replace('PHASE', '')}`) : [],
    locations: study.locations.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
    })),
  };
}

// --- 4. The API Fetcher ---
const FASTAPI_BASE_URL = "http://127.0.0.1:8000/studies";

export async function fetchTrialsFromApi(filters: FilterState & { page: number; limit: number }): Promise<{ trials: Trial[], totalCount: number }> {
  const queryParams = new URLSearchParams();
  if (filters.condition) queryParams.append('q', filters.condition);
  if (filters.status.length > 0) queryParams.append('status', filters.status.join(','));
  if (filters.phase.length > 0) queryParams.append('phase', filters.phase.join(','));
  
  if (filters.bounds) {
      const { sw, ne } = filters.bounds;
      queryParams.append('bbox', `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`);
  }

  queryParams.append('page', String(filters.page + 1)); // FastAPI is 1-indexed, react-paginate is 0-indexed
  queryParams.append('limit', '10'); // Per your requirement

  const url = `${FASTAPI_BASE_URL}?${queryParams.toString()}`;
  console.log("Fetching from FastAPI URL:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FastAPI call failed with status: ${response.status}`);
  }

  const rawResponse = (await response.json()) as PaginatedApiResponse;

  const normalizedTrials = rawResponse.data
    .map(normalizeApiStudy)
    .filter((trial): trial is Trial => trial !== null);

  return {
    trials: normalizedTrials,
    totalCount: rawResponse.total,
  };
}