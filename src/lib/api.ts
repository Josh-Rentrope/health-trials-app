// lib/api.ts

// --- 1. Define the RAW data structure from the V1 API response ---
// This now perfectly matches the JSON you provided.
interface RawApiStudy {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      acronym?: string;
    };
    statusModule: {
      overallStatus: string;
    };
    sponsorCollaboratorsModule: {
      leadSponsor: {
        name: string;
      };
    };
    designModule?: { // Marked as optional since it can be an empty object
      phases?: string[];
    };
  };
}

interface ApiHit {
  id: string;
  study: RawApiStudy;
}

interface ApiResponseV1 {
  total: number;
  hits: ApiHit[];
}

// --- 2. Define our App's CLEAN & RELIABLE data structure (No changes needed here) ---
export interface Trial {
  id: string;
  title: string;
  acronym: string | null;
  status: string;
  sponsor: string;
  phases: string[];
  locations?: { latitude: number; longitude: number }[]; 
}


// --- 3. The Normalizer Function: Updated to handle the new "hit" structure ---

// --- The Normalizer Function: Updated to be more defensive ---
function normalizeV1Hit(hit: ApiHit): Trial | null { // Now returns Trial OR null
  // If a hit is missing the core study object, discard it.
  if (!hit || !hit.study || !hit.study.protocolSection) {
    return null;
  }
  
  const study = hit.study.protocolSection;

  // If the study is missing a title or ID, it's not useful to us.
  if (!study.identificationModule?.nctId || !study.identificationModule?.briefTitle) {
      return null;
  }

  // Helper function to format phase strings (e.g., "PHASE1" -> "Phase 1")
  const formatPhase = (phase: string) => {
    return phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper to format status strings
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  return {
    id: study.identificationModule.nctId,
    title: study.identificationModule.briefTitle,
    acronym: study.identificationModule.acronym || null,
    status: formatStatus(study.statusModule.overallStatus),
    sponsor: study.sponsorCollaboratorsModule.leadSponsor.name,
    // Safely access optional phases and format them
    phases: study.designModule?.phases?.map(formatPhase) || [],
  };
}


// --- 4. The API Fetcher (updated to parse the new response) ---
export interface FilterState {
  condition: string;
  location: string;
  status: string[];
  phase: string[];
  bounds?: any; //TODO: fix type to show bound variables
}

const BASE_URL = "https://clinicaltrials.gov/api/int/studies";

const statusMap: { [key: string]: string } = { RECRUITING: "rec", NOT_YET_RECRUITING: "not", COMPLETED: "com", ACTIVE_NOT_RECRUITING: "act" };
const phaseMap: { [key:string]: string } = { EARLY_PHASE_1: "0", PHASE_1: "1", PHASE_2: "2", PHASE_3: "3", PHASE_4: "4", NOT_APPLICABLE: "NA" };


export async function fetchTrials(filters: FilterState): Promise<{ trials: Trial[], totalCount: number }> {
  // URL construction remains the same
  const queryParams = new URLSearchParams();
  if (filters.condition) queryParams.append('cond', filters.condition);
  if (filters.location) queryParams.append('locn', filters.location);
  const aggFilterParts: string[] = [];
  if (filters.status.length > 0) {
    aggFilterParts.push(`status:${filters.status.map(s => statusMap[s]).join(' ')}`);
  }
  if (filters.phase.length > 0) {
    aggFilterParts.push(`phase:${filters.phase.map(p => phaseMap[p]).join(' ')}`);
  }
  if (aggFilterParts.length > 0) {
    queryParams.append('aggFilters', aggFilterParts.join(','));
  }
  queryParams.append('fields', 'NCTId,BriefTitle,OverallStatus,LeadSponsorName,Phase,Acronym'); // Minimal fields
  queryParams.append('limit', '20');

  const url = `${BASE_URL}?${queryParams.toString()}`;
  console.log("Fetching from V1 URL:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API call failed with status: ${response.status}`);
  }

    const rawResponse = (await response.json()) as ApiResponseV1;

    // Use the new normalizer and filter out any null results
    const normalizedTrials = rawResponse.hits
        .map(normalizeV1Hit)
        .filter((trial): trial is Trial => trial !== null); // This filters out nulls AND provides type safety

    return {
        trials: normalizedTrials,
        totalCount: rawResponse.total,
    };
}

