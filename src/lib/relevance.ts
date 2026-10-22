// Relevance is the product's name for what the questionnaire establishes.
// Keeping the band definitions and the answer summarisers here means the flow,
// the chip, and the chat payload cannot disagree about what was answered.

import { factLabel } from '@/lib/facts';
import type { FilterState } from '@/stores/trialStore';

export interface AgeBand {
  key: string;
  label: string;
  min: number;
  /** `null` is an open-ended band such as 65+. */
  max: number | null;
}

// Categories rather than a number: a reader knows which band they are in without
// typing, and the band never becomes a false precision in a claim about them.
export const AGE_BANDS: AgeBand[] = [
  { key: 'u18', label: 'Under 18', min: 0, max: 17 },
  { key: '18-24', label: '18–24', min: 18, max: 24 },
  { key: '25-34', label: '25–34', min: 25, max: 34 },
  { key: '35-44', label: '35–44', min: 35, max: 44 },
  { key: '45-54', label: '45–54', min: 45, max: 54 },
  { key: '55-64', label: '55–64', min: 55, max: 64 },
  { key: '65+', label: '65+', min: 65, max: null },
];

export function bandByKey(key?: string | null): AgeBand | undefined {
  return AGE_BANDS.find((b) => b.key === key);
}

export function bandForFilters(filters: Pick<
  FilterState,
  'ageBand' | 'ageMin' | 'ageMax' | 'age'
>): AgeBand | null {
  const byKey = bandByKey(filters.ageBand);
  if (byKey) return byKey;
  if (filters.ageMin != null || filters.ageMax != null) {
    return {
      key: 'custom',
      label:
        filters.ageMin != null && filters.ageMax != null
          ? `${filters.ageMin}–${filters.ageMax}`
          : filters.ageMin != null
            ? `${filters.ageMin}+`
            : `up to ${filters.ageMax}`,
      min: filters.ageMin ?? 0,
      max: filters.ageMax ?? null,
    };
  }
  if (typeof filters.age === 'number') {
    return { key: 'exact', label: `${filters.age}`, min: filters.age, max: filters.age };
  }
  return null;
}

export interface RelevanceAnswer {
  label: string;
  value: string;
}

/** Everything the reader told us, in the order it is asked. */
export function relevanceAnswers(
  filters: Pick<
    FilterState,
    'age' | 'ageBand' | 'ageMin' | 'ageMax' | 'sex' | 'healthyVolunteer' | 'facts'
  >,
): RelevanceAnswer[] {
  const out: RelevanceAnswer[] = [];

  const band = bandForFilters(filters);
  if (band) out.push({ label: 'Age', value: band.label });

  if (filters.sex === 'female' || filters.sex === 'male') {
    out.push({ label: 'Sex', value: filters.sex === 'female' ? 'Female' : 'Male' });
  }

  if (filters.healthyVolunteer === true) {
    out.push({ label: 'Healthy volunteer', value: 'Yes' });
  } else if (filters.healthyVolunteer === false) {
    out.push({ label: 'Diagnosis being studied', value: 'Yes' });
  }

  for (const [key, has] of Object.entries(filters.facts ?? {})) {
    out.push({ label: factLabel(key), value: has ? 'Yes' : 'No' });
  }

  return out;
}

export function hasRelevanceAnswers(
  filters: Parameters<typeof relevanceAnswers>[0],
): boolean {
  return relevanceAnswers(filters).length > 0;
}

/**
 * The payload the chat sends with every message. It is deliberately the same
 * vocabulary the search tool accepts, so "filter by what the reader told us" is
 * one hop rather than a paraphrase the model has to guess at.
 */
export function relevancePayload(filters: FilterState) {
  if (!hasRelevanceAnswers(filters)) return null;
  const band = bandForFilters(filters);
  return {
    age: filters.age ?? null,
    age_min: band?.min ?? null,
    age_max: band?.max ?? null,
    age_label: band?.label ?? null,
    sex: filters.sex ?? null,
    healthy_volunteer: filters.healthyVolunteer ?? null,
    facts: filters.facts ?? {},
    condition: filters.condition || null,
  };
}
