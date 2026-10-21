// lib/api-client.ts
//
// The single data layer for the app. Rewritten from the original, which had
// three problems worth naming:
//
//  1. The API base URL was a hardcoded literal
//     (`https://backend.withpower-demo.codingshinobi.com`). It reads from
//     NEXT_PUBLIC_API_BASE_URL now, which is also what lets the deployed front
//     end point at a different API without a code change.
//
//  2. Chat used an `X-User-Email` header, and `fetchWithEmail` *ignored its own
//     `email` argument* -- it hardcoded one UUID. Every visitor therefore shared
//     a single identity and could list every other visitor's conversations. Chat
//     now uses the server-issued session cookie, so the identity cannot be
//     chosen by the caller.
//
//  3. There were two parallel chat families (a `_demo` set and a Bearer set) and
//     the live components called one of each. There is one set now.
//
// Every request sends `credentials: 'include'`. That, an exact origin in the
// API's CORS config, and `allow_credentials=True` on the server are all
// required for the cookie to survive the cross-origin call -- and all three
// fail silently if omitted, so they are worth keeping together in one place.

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

function url(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function getJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url(path), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${path} failed with ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }
  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

// ── types ───────────────────────────────────────────────────────────────────

export interface StudyLocation {
  location_text: string;
  latitude: number;
  longitude: number;
  /** Which geocode tier produced this point: postal | city | admin1 | country | none. */
  precision?: string | null;
}

export interface ApiStudy {
  nct_number: string;
  study_title: string;
  study_url?: string | null;
  acronym?: string | null;
  status?: string | null;
  conditions?: string | null;
  phase?: string | null;
  sponsor?: string | null;
  enrollment_count?: number | null;
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
  locations?: { latitude: number; longitude: number; precision?: string | null }[];
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

export interface Bounds {
  sw: { lng: number; lat: number };
  ne: { lng: number; lat: number };
}

/**
 * The filter surface the store produces. Declared explicitly rather than as
 * `Record<string, unknown>` so passing the store's `FilterState` (which has
 * extra fields like `correlationCondition`) is assignable without a cast --
 * a `Record` requires an index signature, which a concrete interface lacks.
 */
export interface StudyFilters {
  condition?: string;
  status?: string[];
  phase?: string[];
  bounds?: Bounds;
  location?: string;
  page?: number;
  limit?: number;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: unknown;
    properties: { GEOID: string; NAME: string };
  }[];
}

// The assistant's own messages. Mirrors migrations.AI_SENDER_ID on the server.
export const AI_SENDER_ID = '00000000-0000-0000-0000-000000000000';

// ── normalisation ───────────────────────────────────────────────────────────

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function normalizeApiStudy(study: ApiStudy): Trial | null {
  if (!study?.nct_number || !study?.study_title) return null;
  return {
    is_cluster: false,
    id: study.nct_number,
    title: study.study_title,
    acronym: study.acronym ?? null,
    status: study.status ? formatStatus(study.status) : 'Unknown',
    // The API returns these now; the original hardcoded the string
    // "Sponsor from DB" because it did not.
    sponsor: study.sponsor ?? 'Sponsor not listed',
    phases: study.phase
      ? study.phase.split('|').map((p) => `Phase ${p.replace('PHASE', '').replace('EARLY ', '')}`)
      : [],
    locations: (study.locations ?? []).map((l) => ({
      latitude: l.latitude,
      longitude: l.longitude,
      precision: l.precision ?? null,
    })),
  };
}

// ── studies ─────────────────────────────────────────────────────────────────

export async function fetchTrialsFromApi(
  filters: StudyFilters,
): Promise<{ trials: Trial[]; totalCount: number }> {
  const qs = new URLSearchParams();
  if (filters.condition) qs.append('q', String(filters.condition));
  if (Array.isArray(filters.status) && filters.status.length) {
    qs.append('status', filters.status.join(','));
  }
  if (Array.isArray(filters.phase) && filters.phase.length) {
    qs.append('phase', filters.phase.join(','));
  }
  const bounds = filters.bounds;
  if (bounds) {
    qs.append('bbox', `${bounds.sw.lng},${bounds.sw.lat},${bounds.ne.lng},${bounds.ne.lat}`);
  }
  qs.append('page', String(filters.page ? Number(filters.page) + 1 : 1));
  qs.append('limit', String(filters.limit ?? 10));

  const raw = await getJson<PaginatedApiResponse>(`/studies?${qs}`);
  return {
    trials: raw.data.map(normalizeApiStudy).filter((t): t is Trial => t !== null),
    totalCount: raw.total,
  };
}

export async function fetchMapData(
  filters: StudyFilters,
  zoom: number,
): Promise<MapData> {
  const bounds = filters.bounds;
  if (!bounds) return [];

  const qs = new URLSearchParams();
  qs.append('bbox', `${bounds.sw.lng},${bounds.sw.lat},${bounds.ne.lng},${bounds.ne.lat}`);
  qs.append('zoom', String(Math.round(zoom)));
  if (filters.condition) qs.append('q', String(filters.condition));
  if (Array.isArray(filters.status) && filters.status.length) qs.append('status', filters.status.join(','));
  if (Array.isArray(filters.phase) && filters.phase.length) qs.append('phase', filters.phase.join(','));

  const raw = await getJson<(ApiCluster | ApiStudy)[]>(`/studies/map-data?${qs}`);
  return raw
    .map((item) => ('is_cluster' in item && item.is_cluster ? (item as ApiCluster) : normalizeApiStudy(item as ApiStudy)))
    .filter((x): x is ApiCluster | Trial => x !== null);
}

export async function fetchCountyBoundariesFromApi(): Promise<GeoJSONFeatureCollection> {
  return getJson<GeoJSONFeatureCollection>('/api/boundaries/counties');
}

export async function fetchCorrelationData(
  condition: string,
  demographicVariable: string,
): Promise<CountyCorrelation[]> {
  const qs = new URLSearchParams({ condition, demographic_variable: demographicVariable });
  return getJson<CountyCorrelation[]>(`/api/correlation?${qs}`);
}

// ── sessions ────────────────────────────────────────────────────────────────

/**
 * Ensure a session cookie exists, minting one if not.
 *
 * This is the only place identity is established. Calling it before the first
 * chat request means the cookie is set by a request the app controls, rather
 * than depending on the first chat call to have established it.
 */
export async function ensureSession(): Promise<{ display_name: string | null }> {
  return getJson<{ display_name: string | null }>('/api/session');
}

// ── chat ────────────────────────────────────────────────────────────────────

export function getConversations(): Promise<Conversation[]> {
  return getJson<Conversation[]>('/api/chat/conversations');
}

export function createConversation(): Promise<Conversation> {
  return getJson<Conversation>('/api/chat/conversations', { method: 'POST' });
}

export function deleteConversation(convId: string): Promise<null> {
  return getJson<null>(`/api/chat/conversations/${convId}`, { method: 'DELETE' });
}

export function getMessages(convId: string): Promise<ChatMessage[]> {
  return getJson<ChatMessage[]>(`/api/chat/conversations/${convId}/messages`);
}

export function postMessage(convId: string, content: string): Promise<ChatMessage> {
  return getJson<ChatMessage>(`/api/chat/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
