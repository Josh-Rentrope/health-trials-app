'use client';

// use-eligibility.ts
//
// The question loop, shared by the quick dialog on /trials and the full wizard
// on /match. Both call the same endpoint with the same answer shape; keeping the
// query in one hook is what stops the two surfaces from drifting apart (which is
// how a count shown in one place stops matching the count shown in the other).

import { useQuery } from '@tanstack/react-query';

import { fetchSegment, SegmentQuestion } from '@/lib/api-client';

export interface EligibilityAnswers {
  age: number | null;
  sex: 'female' | 'male' | null;
  healthyVolunteer: boolean | null;
  /** "prior_therapy:chemotherapy": true means the reader HAS had it. */
  facts: Record<string, boolean>;
}

export interface NextQuestion {
  question: SegmentQuestion | null;
  total: number | null;
  /** A response has arrived, so `null` question means "no more questions". */
  hasLoaded: boolean;
  isFetching: boolean;
  error: Error | null;
}

export function useNextQuestion(
  condition: string | undefined,
  status: string | undefined,
  answers: EligibilityAnswers,
  enabled: boolean,
): NextQuestion {
  const { data, isFetching, error } = useQuery({
    // The endpoint is deterministic arithmetic over the pool, so a short
    // staleTime is honest and saves a round trip when a step is revisited.
    queryKey: ['segment', condition ?? '', status ?? '', answers],
    queryFn: () =>
      fetchSegment({
        condition: condition || undefined,
        status: status || undefined,
        answers: {
          age: answers.age,
          sex: answers.sex,
          healthy_volunteer: answers.healthyVolunteer,
          facts: answers.facts,
        },
      }),
    enabled,
    retry: false,
    staleTime: 60_000,
  });

  return {
    question: data?.next_question ?? null,
    total: data?.total ?? null,
    hasLoaded: data !== undefined,
    isFetching,
    error: (error as Error) ?? null,
  };
}

/** "prior_therapy:chemotherapy" -> "Prior therapy (chemotherapy)" */
export function factLabel(key: string): string {
  const [factKey, ...rest] = key.split(':');
  const value = rest.join(':');
  const human = factKey.replace(/_/g, ' ');
  return value ? `${human} (${value.replace(/_/g, ' ')})` : human;
}
