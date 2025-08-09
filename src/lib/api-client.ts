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

export interface ApiCluster {
  is_cluster: true;
  point_count: number;
  latitude: number;
  longitude: number;
}


export interface Trial {
  is_cluster: false;
  id: string;
  title: string;
  acronym: string | null;
  status: string;
  sponsor: string;
  phases: string[];
  locations?: { latitude: number; longitude: number }[];
}


export type MapData = (ApiCluster | Trial)[];

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    sent_at: string;
}

export interface Conversation {
    id: string;
    created_at: string;
    updated_at: string;
    participants: { user_id: string }[];
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
const API_BASE_URL = "http://127.0.0.1:8000";

// Helper for making authenticated requests
async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
    }
    return response.json();
}


export async function fetchTrialsFromApi(filters: FilterState & { page: number; limit: number }): Promise<{ trials: Trial[], totalCount: number }> {
  const queryParams = new URLSearchParams();
  if (filters.condition) queryParams.append('q', filters.condition);
  if (filters.status.length > 0) queryParams.append('status', filters.status.join(','));
  if (filters.phase.length > 0) queryParams.append('phase', filters.phase.join(','));

  if (filters.bounds) {
      const { sw, ne } = filters.bounds;
      queryParams.append('bbox', `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`);
  }

  queryParams.append('page', String(filters.page + 1));
  queryParams.append('limit', '10');

  const url = `${API_BASE_URL}/studies?${queryParams.toString()}`;
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

export async function fetchMapData(filters: FilterState, zoom: number): Promise<MapData> {
  if (!filters.bounds) return [];

  const queryParams = new URLSearchParams();
  const { sw, ne } = filters.bounds;
  queryParams.append('bbox', `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`);
  queryParams.append('zoom', String(Math.round(zoom)));

  const url = `${API_BASE_URL}/studies/map-data?${queryParams.toString()}`;
  console.log("Fetching from new map data URL:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FastAPI map data call failed with status: ${response.status}`);
  }

  const rawResponse = (await response.json());

  return rawResponse.map((item: any) => {
    if (item.is_cluster) return item as ApiCluster;
    return {
      is_cluster: false,
      id: item.nct_number,
      title: item.study_title,
      locations: item.locations
    } as Trial;
  });
}

// --- NEW: API Functions for Chat ---
export async function fetchConversations(token: string): Promise<Conversation[]> {
    return fetchWithAuth(`${API_BASE_URL}/api/chat/conversations`, token);
}

export async function postMessage(convId: string, content: string, token: string): Promise<ChatMessage> {
    return fetchWithAuth(`${API_BASE_URL}/api/chat/conversations/${convId}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
}