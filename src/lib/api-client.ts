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


export interface CompletedTrial {
  id: string;
  title: string;
  status: string;
  sponsor: string | null;
}

export interface CountyCorrelation {
  fips_code: string;
  county_name: string;
  demographic_value: number | null;
  completed_trials: CompletedTrial[];
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
    is_cluster: false,
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
const API_BASE_URL = "https://backend.withpower-demo.codingshinobi.com";

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

async function fetchWithEmail(url: string, email: string, options: RequestInit = {}) {
    const headers = {
        ...options.headers,
        'X-User-Email': "e1656d48-b566-4731-80b5-efe9ad37c28c", // Add the custom email header
        'Content-Type': 'application/json',
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
    }
    // Handle cases with no JSON response body (e.g., 204 No Content)
    if (response.status === 204) {
        return null;
    }
    return response.json();
}


export async function fetchTrialsFromApi(filters: FilterState & { page?: number; limit?: number }): Promise<{ trials: Trial[], totalCount: number }> {
  const queryParams = new URLSearchParams();
  if (filters.condition) queryParams.append('q', filters.condition);
  if (filters.status && filters.status.length > 0) queryParams.append('status', filters.status.join(','));
  
  // --- FIX: Remove incorrect string replacement. Backend will handle the keys. ---
  if (filters.phase && filters.phase.length > 0) queryParams.append('phase', filters.phase.join(','));

  if (filters.bounds) {
      const { sw, ne } = filters.bounds;
      queryParams.append('bbox', `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`);
  }

  queryParams.append('page', String(filters.page ? filters.page + 1 : 1));
  queryParams.append('limit', String(filters.limit || 10));

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

  // Append other filters
  if (filters.condition) queryParams.append('q', filters.condition);
  if (filters.status && filters.status.length > 0) queryParams.append('status', filters.status.join(','));
  if (filters.phase && filters.phase.length > 0) queryParams.append('phase', filters.phase.join(','));


  const url = `${API_BASE_URL}/studies/map-data?${queryParams.toString()}`;
  console.log("Fetching from new map data URL:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FastAPI map data call failed with status: ${response.status}`);
  }

  const rawResponse = (await response.json());

  // The backend now returns objects that match ApiCluster or a simplified Trial structure
  // We need to normalize the trials to our frontend Trial type
  return rawResponse.map((item: any) => {
    if (item.is_cluster) {
      return item as ApiCluster;
    }
    // It's a study from the backend, normalize it
    return normalizeApiStudy(item as ApiStudy);
  }).filter(Boolean); // Filter out any nulls from normalization
}


// --- API Functions for Chat (Authenticated) ---
export function getConversations(token: string): Promise<Conversation[]> {
    return fetchWithAuth(`${API_BASE_URL}/api/chat/conversations`, token);
}

export function createConversation(token: string): Promise<Conversation> {
  return fetchWithAuth(`${API_BASE_URL}/api/chat/conversations`, token, {
    method: 'POST',
    // The backend automatically adds the creator, so the body can be simple
    body: JSON.stringify({ participant_ids: [] }),
  });
};

export function deleteConversation(token: string, convId: string): Promise<null> {
    return fetchWithAuth(`${API_BASE_URL}/api/chat/conversations/${convId}`, token, { method: 'DELETE' });
};

export function getMessages(token: string, convId: string): Promise<ChatMessage[]> {
  return fetchWithAuth(`${API_BASE_URL}/api/chat/conversations/${convId}/messages`, token, { method: 'GET' });
};

export function postMessage(token: string, convId: string, content: string): Promise<ChatMessage> {
    return fetchWithAuth(`${API_BASE_URL}/api/chat/conversations/${convId}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
}

export async function getConversations_demo(email: string): Promise<Conversation[]> {
    return fetchWithEmail(`${API_BASE_URL}/api/chat/conversations`, email);
}

export function deleteConversation_demo(email: string, convId: string): Promise<null> {
    return fetchWithEmail(`${API_BASE_URL}/api/chat/conversations/${convId}`, email, { method: 'DELETE' });
};

    /**
   * ## NEW: Creates a new conversation.
   * @param currentUserEmail The email of the user initiating the conversation.
   * @param participantEmails An array of other participants' emails.
   * @returns The newly created conversation object.
   */
export function createConversation_demo(currentUserEmail: string, participantEmails: string[]): Promise<Conversation> {
      const payload = {
          participant_ids: participantEmails,
      };
      return fetchWithEmail(`${API_BASE_URL}/api/chat/conversations/create`, currentUserEmail, {
          method: 'POST',
          body: JSON.stringify(payload),
      });
}

export function getMessages_demo(email: string, convId: string): Promise<ChatMessage[]> {
  return fetchWithEmail(`${API_BASE_URL}/api/chat/conversations/${convId}/messages`, email, { method: 'GET' });
};


export async function postMessage_demo(convId: string, content: string, email: string): Promise<ChatMessage> {
    return fetchWithEmail(`${API_BASE_URL}/api/chat/conversations/${convId}/messages`, email, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
}

export async function fetchCorrelationData(
  condition: string,
  demographicVariable: string
): Promise<CountyCorrelation[]> {
  const queryParams = new URLSearchParams({
    condition: condition,
    demographic_variable: demographicVariable,
  });

  const url = `${API_BASE_URL}/api/correlation?${queryParams.toString()}`;
  console.log("Fetching from correlation data URL:", url);

  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.detail || `Correlation data call failed with status: ${response.status}`);
  }

  return response.json();
}
// This defines the structure of the data we expect from the new endpoint.
export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: any;
    properties: {
      GEOID: string;
      NAME: string;
    };
  }[];
}

// --- NEW: Function to fetch county boundaries from our own API ---
export async function fetchCountyBoundariesFromApi(): Promise<GeoJSONFeatureCollection> {
  const url = `${API_BASE_URL}/api/boundaries/counties`;
  console.log("Fetching county boundaries from:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch county boundaries: ${response.status}`);
  }
  return response.json();
}