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
  city?: string | null;
  country_code?: string | null;
  latitude: number;
  longitude: number;
  /** Which geocode tier produced this point: postal | city | admin1 | country | none. */
  precision?: string | null;
}

/**
 * How a study reads against the answers the reader gave.
 *
 * `check_with_site` is not a hedge: the registry genuinely does not state
 * everything a protocol requires (organ function, measurable disease), and this
 * product does not pretend otherwise.
 */
export interface StudyFit {
  verdict: 'meets_listed' | 'check_with_site' | 'does_not_match';
  reasons: string[];
  unknown_count: number;
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
  min_age_years?: number | null;
  max_age_years?: number | null;
  sex?: string | null;
  healthy_volunteers?: boolean | null;
  /** Present only once the reader has answered something. */
  fit?: StudyFit | null;
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

export interface ApiSite {
  is_site: true;
  point_count: number;
  latitude: number;
  longitude: number;
  trials: ApiStudy[];
}

export interface Trial {
  is_cluster: false;
  is_site?: false;
  id: string;
  title: string;
  acronym: string | null;
  status: string;
  sponsor: string;
  phases: string[];
  /** Registry condition text, shown in the detail modal. */
  conditions?: string | null;
  /** Planned enrolment, shown in the detail modal. */
  enrollmentCount?: number | null;
  /** Structured eligibility, straight from the registry. */
  minAgeYears?: number | null;
  maxAgeYears?: number | null;
  sex?: string | null;
  healthyVolunteers?: boolean | null;
  fit?: StudyFit | null;
  locations?: {
    latitude: number;
    longitude: number;
    precision?: string | null;
    city?: string | null;
    countryCode?: string | null;
  }[];
}

/**
 * One geocoded location hosting several studies.
 *
 * Locations dedupe at city level, so a single point can stand for a research hub
 * with thousands of studies — Houston alone has over 15,000. The API returns the
 * true total plus the five most recent, which is what the popup lists.
 */
export interface Site {
  // The two flags together make the union discriminable: every map item is
  // (is_cluster true) | (is_site true) | (both false, a Trial). Without
  // `is_cluster: false` here, checking `item.is_cluster` is a type error.
  is_cluster: false;
  is_site: true;
  point_count: number;
  latitude: number;
  longitude: number;
  trials: Trial[];
}

export type MapData = (ApiCluster | Site | Trial)[];

/** A map item that is not a cluster — either one trial or a multi-trial site. */
export type MapPoint = Site | Trial;

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
  /** Answers from the questionnaire. Only sent when the reader has given them. */
  age?: number | null;
  ageMin?: number | null;
  /** `null` means open-ended (65+). */
  ageMax?: number | null;
  sex?: 'female' | 'male' | null;
  healthyVolunteer?: boolean | null;
  /** "prior_therapy:chemotherapy": true, meaning the reader HAS had it. */
  facts?: Record<string, boolean>;
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
    conditions: study.conditions ?? null,
    enrollmentCount: study.enrollment_count ?? null,
    minAgeYears: study.min_age_years ?? null,
    maxAgeYears: study.max_age_years ?? null,
    sex: study.sex ?? null,
    healthyVolunteers: study.healthy_volunteers ?? null,
    fit: study.fit ?? null,
    locations: (study.locations ?? []).map((l) => ({
      latitude: l.latitude,
      longitude: l.longitude,
      precision: l.precision ?? null,
      city: l.city ?? null,
      countryCode: l.country_code ?? null,
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
  if (typeof filters.age === 'number') qs.append('age', String(filters.age));
  if (typeof filters.ageMin === 'number') qs.append('age_min', String(filters.ageMin));
  if (typeof filters.ageMax === 'number') qs.append('age_max', String(filters.ageMax));
  if (filters.sex) qs.append('sex', filters.sex);
  // Both directions matter. Sending only `false` meant a healthy reader's answer
  // filtered nothing, because the server never heard it.
  if (typeof filters.healthyVolunteer === 'boolean') {
    qs.append('healthy_volunteer', String(filters.healthyVolunteer));
  }
  for (const [key, has] of Object.entries(filters.facts ?? {})) {
    qs.append('fact', `${key}:${has ? 'yes' : 'no'}`);
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
  // The cluster counts must reflect the same pool as the list, including the
  // relevance answers; otherwise the zoomed-out map is a different search.
  if (typeof filters.age === 'number') qs.append('age', String(filters.age));
  if (typeof filters.ageMin === 'number') qs.append('age_min', String(filters.ageMin));
  if (typeof filters.ageMax === 'number') qs.append('age_max', String(filters.ageMax));
  if (filters.sex) qs.append('sex', filters.sex);
  if (typeof filters.healthyVolunteer === 'boolean') {
    qs.append('healthy_volunteer', String(filters.healthyVolunteer));
  }
  for (const [key, has] of Object.entries(filters.facts ?? {})) {
    qs.append('fact', `${key}:${has ? 'yes' : 'no'}`);
  }

  type RawMapItem = ApiCluster | ApiSite | ApiStudy;
  const raw = await getJson<RawMapItem[]>(`/studies/map-data?${qs}`);
  return raw
    .map((item): ApiCluster | Site | Trial | null => {
      if ('is_cluster' in item && item.is_cluster) return item as ApiCluster;
      if ('is_site' in item && item.is_site) {
        const site = item as ApiSite;
        return {
          is_cluster: false as const,
          is_site: true as const,
          point_count: site.point_count,
          latitude: site.latitude,
          longitude: site.longitude,
          trials: (site.trials ?? [])
            .map(normalizeApiStudy)
            .filter((t): t is Trial => t !== null),
        };
      }
      return normalizeApiStudy(item as ApiStudy);
    })
    .filter((x): x is ApiCluster | Site | Trial => x !== null);
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

// ── questionnaire ───────────────────────────────────────────────────────────

export interface SegmentQuestion {
  question: string;
  key: string;
  split: { requires: number; excludes: number; silent: number };
  eliminates_if_yes: number;
  eliminates_if_no: number;
}

export interface SegmentResponse {
  total: number;
  next_question: SegmentQuestion | null;
  message?: string;
}

/**
 * Ask which question to ask next.
 *
 * The endpoint is stateless and computes the answer from the candidate pool --
 * this is arithmetic on the server, not a model call, so it costs nothing and
 * gives the same answer twice.
 */
export async function fetchSegment(body: {
  condition?: string;
  status?: string;
  phase?: string;
  answers: {
    age?: number | null;
    age_min?: number | null;
    age_max?: number | null;
    sex?: string | null;
    healthy_volunteer?: boolean | null;
    facts?: Record<string, boolean>;
  };
}): Promise<SegmentResponse> {
  return getJson<SegmentResponse>('/api/qualify/segment', {
    method: 'POST',
    body: JSON.stringify(body),
  });
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

/**
 * The relevance answers travel with every message. They are what lets the model
 * filter instead of guessing, and they use the same names the search tool takes.
 */
export interface RelevancePayload {
  age?: number | null;
  age_min?: number | null;
  age_max?: number | null;
  age_label?: string | null;
  sex?: 'female' | 'male' | null;
  healthy_volunteer?: boolean | null;
  facts?: Record<string, boolean>;
  condition?: string | null;
}

export function postMessage(
  convId: string,
  content: string,
  relevance?: RelevancePayload | null,
): Promise<ChatMessage> {
  return getJson<ChatMessage>(`/api/chat/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, ...(relevance ? { relevance } : {}) }),
  });
}
