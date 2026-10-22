'use client';

// RelevanceFlow.tsx
//
// ONE implementation of the relevance questionnaire, mounted either as a dialog
// on /trials or inline on /match. The two surfaces used to be separate copies,
// which is how a count shown in one place starts disagreeing with the other.
//
// The question order is not hardcoded. Each turn asks the server which single
// question splits the remaining candidates most evenly; answering it recomputes
// the pool, so the tree follows the reader's answers. Age is a band, not a
// number: the filter keeps studies whose range overlaps the band, and a boundary
// inside the band is reported as uncertain rather than silently decided.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X } from 'lucide-react';

import { fetchTrialsFromApi, Trial } from '@/lib/api-client';
import { factLabel } from '@/lib/facts';
import { AGE_BANDS, bandByKey, relevanceAnswers } from '@/lib/relevance';
import { useNextQuestion } from '@/lib/use-eligibility';
import { useTrialStore } from '@/stores/trialStore';
import { TrialCard } from '@/components/trial/TrialCard';

type Step = 'about' | 'questions' | 'results';

const FIT_RANK: Record<string, number> = {
  meets_listed: 0,
  check_with_site: 1,
  does_not_match: 2,
};

const STEP_LABEL: Record<Step, string> = {
  about: 'Step 1 of 3 · About you',
  questions: 'Step 2 of 3 · A few questions',
  results: 'Step 3 of 3 · Your shortlist',
};

export interface RelevanceFlowProps {
  variant: 'dialog' | 'page';
  onClose?: () => void;
  /** The page owns the condition input; the dialog inherits the current search. */
  showCondition?: boolean;
}

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ['about', 'questions', 'results'];
  const index = order.indexOf(step);
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Step ${index + 1} of 3`}>
      {order.map((s, i) => (
        <li
          key={s}
          className={
            'h-1.5 rounded-full transition-colors ' +
            (i <= index ? 'w-8 bg-accent' : 'w-5 bg-line')
          }
          aria-hidden
        />
      ))}
    </ol>
  );
}

function bandKeyFor(
  ageBand: string | null | undefined,
  ageMin: number | null | undefined,
  ageMax: number | null | undefined,
): string | null {
  if (ageBand) return ageBand;
  const match = AGE_BANDS.find(
    (b) => b.min === (ageMin ?? null) && b.max === (ageMax ?? null),
  );
  return match?.key ?? null;
}

export function RelevanceFlow({ variant, onClose, showCondition }: RelevanceFlowProps) {
  const router = useRouter();
  const setFilters = useTrialStore((s) => s.setFilters);
  const setPagination = useTrialStore((s) => s.setPagination);
  const storeFilters = useTrialStore((s) => s.filters);

  const [step, setStep] = useState<Step>('about');
  const [condition, setCondition] = useState(storeFilters.condition ?? '');
  const [ageBand, setAgeBand] = useState<string | null>(() =>
    bandKeyFor(storeFilters.ageBand, storeFilters.ageMin, storeFilters.ageMax),
  );
  const [sex, setSex] = useState<'' | 'female' | 'male'>(storeFilters.sex ?? '');
  const [healthy, setHealthy] = useState<boolean | null>(
    storeFilters.healthyVolunteer ?? null,
  );
  const [facts, setFacts] = useState<Record<string, boolean>>(
    storeFilters.facts ?? {},
  );
  const [asked, setAsked] = useState<string[]>(() =>
    Object.keys(storeFilters.facts ?? {}),
  );
  // Changing a structured answer invalidates the fact questions that were chosen
  // for the old pool. This key is how that reset is detected without asking the
  // reader to start over.
  const demoKey = `${ageBand ?? ''}|${sex}|${healthy === null ? '' : healthy}`;
  const [questionsFor, setQuestionsFor] = useState(() => demoKey);

  const band = bandByKey(ageBand);
  const ageMin = band?.min ?? null;
  const ageMax = band?.max ?? null;

  // Display-only view of the local answers; the same helper feeds the chip.
  const localAnswers = relevanceAnswers({
    age: null,
    ageBand,
    ageMin,
    ageMax,
    sex: sex || null,
    healthyVolunteer: healthy,
    facts,
  });

  const answers = useMemo(
    () => ({
      age: null as number | null,
      ageMin,
      ageMax,
      sex: (sex || null) as 'female' | 'male' | null,
      healthyVolunteer: healthy,
      facts,
    }),
    [ageMin, ageMax, sex, healthy, facts],
  );

  const { question, total, hasLoaded, isFetching, error } = useNextQuestion(
    condition.trim() || undefined,
    storeFilters.status.join(','),
    answers,
    step === 'questions',
  );

  const firstTotal = useRef<number | null>(null);
  useEffect(() => {
    if (step === 'questions' && firstTotal.current === null && total !== null) {
      firstTotal.current = total;
    }
  }, [step, total]);

  const narrowed =
    firstTotal.current && total !== null
      ? Math.max(0, Math.min(1, 1 - total / firstTotal.current))
      : 0;

  // The loop ends when the server has nothing left worth asking, the pool is
  // empty, or a question would repeat. Repeating one is a dead end.
  useEffect(() => {
    if (step !== 'questions' || !hasLoaded) return;
    if (!question || asked.includes(question.key)) setStep('results');
  }, [step, hasLoaded, question, asked]);

  const resultFilters = useMemo(
    () => ({
      condition: condition.trim() || undefined,
      age: null as number | null,
      ageMin,
      ageMax,
      sex: (sex || null) as 'female' | 'male' | null,
      healthyVolunteer: healthy,
      facts,
      page: 0,
      limit: variant === 'dialog' ? 8 : 25,
    }),
    [condition, ageMin, ageMax, sex, healthy, facts, variant],
  );

  const {
    data,
    isFetching: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ['relevance-shortlist', resultFilters],
    queryFn: () => fetchTrialsFromApi(resultFilters),
    enabled: step === 'results',
    placeholderData: (previous) => previous,
  });

  const shortlist: Trial[] = useMemo(() => {
    const rows = data?.trials ?? [];
    return [...rows].sort(
      (a, b) =>
        (FIT_RANK[a.fit?.verdict ?? 'check_with_site'] ?? 1) -
        (FIT_RANK[b.fit?.verdict ?? 'check_with_site'] ?? 1),
    );
  }, [data]);

  const answer = (has: boolean) => {
    if (!question) return;
    setFacts((prev) => ({ ...prev, [question.key]: has }));
    setAsked((prev) => [...prev, question.key]);
  };

  const continueToQuestions = () => {
    if (questionsFor !== demoKey) {
      // Different structured answers means a different pool; answers to the old
      // pool's questions are not evidence about this one.
      setFacts({});
      setAsked([]);
      firstTotal.current = null;
      setQuestionsFor(demoKey);
    }
    setStep('questions');
  };

  const apply = (navigate: boolean) => {
    setFilters({
      condition,
      age: null,
      ageBand,
      ageMin,
      ageMax,
      sex: sex || null,
      healthyVolunteer: healthy,
      facts,
    });
    setPagination({ page: 0 });
    if (navigate) router.push('/trials');
    else if (variant === 'dialog') onClose?.();
  };

  const clearAnswers = () => {
    setAgeBand(null);
    setSex('');
    setHealthy(null);
    setFacts({});
    setAsked([]);
    firstTotal.current = null;
    setStep('about');
    setFilters({
      age: null,
      ageBand: null,
      ageMin: null,
      ageMax: null,
      sex: null,
      healthyVolunteer: null,
      facts: {},
    });
    setPagination({ page: 0 });
  };

  const titleClass =
    'flex items-center gap-2 text-[22px] font-semibold tracking-tight text-ink';
  const title = (
    <>
      <Sparkles size={20} className="text-accent" aria-hidden />
      Find relevant studies
    </>
  );
  const answeredCount = asked.length;

  return (
    <div className="flex h-full flex-col">
      <header
        className={
          'flex items-start justify-between gap-4 bg-surface px-6 py-4 ' +
          (variant === 'dialog'
            ? 'sticky top-0 z-10 border-b border-line'
            : 'border-b border-line')
        }
      >
        <div>
          {variant === 'dialog' ? (
            <h2 className={titleClass}>{title}</h2>
          ) : (
            <h1 className={titleClass}>{title}</h1>
          )}
          <p className="mt-1 text-[13px] text-muted">{STEP_LABEL[step]}</p>
        </div>
        <div className="flex items-center gap-3">
          <StepDots step={step} />
          {variant === 'dialog' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 rounded-md p-2 text-muted hover:bg-canvas hover:text-ink"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 px-6 py-5">
        {/* ── Step 1: structured fields ─────────────────────────────────── */}
        {step === 'about' && (
          <div className="space-y-6">
            {showCondition ? (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-ink">
                  Condition or keywords{' '}
                  <span className="font-normal text-muted">(optional)</span>
                </span>
                <input
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g. melanoma, type 2 diabetes, Crohn's"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[15px] text-ink outline-none focus:border-accent"
                />
                <span className="mt-1.5 block text-[12px] text-muted">
                  Without one, the questions still work but the shortlist is drawn
                  from all 600,000+ studies.
                </span>
              </label>
            ) : (
              <p className="text-[13px] text-muted">
                Searching within{' '}
                <span className="font-medium text-ink">
                  {condition.trim() || 'all studies'}
                </span>
                .
              </p>
            )}

            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink">Age</legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {AGE_BANDS.map((b) => {
                  const selected = ageBand === b.key;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setAgeBand(selected ? null : b.key)}
                      aria-pressed={selected}
                      className={`rounded-md border px-2 py-2 text-[13px] transition-colors ${
                        selected
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line text-ink hover:border-accent/40'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setAgeBand(null)}
                className="mt-2 text-[12px] text-muted hover:text-ink"
              >
                Prefer not to say
              </button>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink">Sex</legend>
              <div className="flex gap-2">
                {(['female', 'male'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSex(sex === value ? '' : value)}
                    aria-pressed={sex === value}
                    className={`flex-1 rounded-md border px-3 py-2 text-[14px] transition-colors ${
                      sex === value
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line text-ink hover:border-accent/40'
                    }`}
                  >
                    {value === 'female' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSex('')}
                className="mt-2 text-[12px] text-muted hover:text-ink"
              >
                Prefer not to say
              </button>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink">
                Do you have a diagnosis being studied?
              </legend>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHealthy(healthy === false ? null : false)}
                  aria-pressed={healthy === false}
                  className={`rounded-md border px-4 py-2 text-[14px] ${
                    healthy === false
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-ink hover:border-accent/40'
                  }`}
                >
                  Yes, I have a diagnosis
                </button>
                <button
                  type="button"
                  onClick={() => setHealthy(healthy === true ? null : true)}
                  aria-pressed={healthy === true}
                  className={`rounded-md border px-4 py-2 text-[14px] ${
                    healthy === true
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line text-ink hover:border-accent/40'
                  }`}
                >
                  No, I am healthy
                </button>
                <button
                  type="button"
                  onClick={() => setHealthy(null)}
                  className="px-2 py-2 text-[13px] text-muted hover:text-ink"
                >
                  Prefer not to say
                </button>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-muted">
                Treatment studies usually do not accept healthy volunteers; saying
                you are healthy removes them.
              </p>
            </fieldset>
          </div>
        )}

        {/* ── Step 2: one question at a time ────────────────────────────── */}
        {step === 'questions' && (
          <div className="space-y-4">
            {isFetching && !hasLoaded ? (
              <div className="flex items-center gap-2 py-12 text-[14px] text-muted">
                <Loader2 size={16} className="animate-spin" /> Finding the question
                that narrows this most…
              </div>
            ) : error ? (
              <p className="py-8 text-[14px] text-warn">
                Could not load the next question. {error.message}
              </p>
            ) : question ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
                  <span>
                    Question {answeredCount + 1}
                    {total !== null && (
                      <> · {total.toLocaleString()} studies left</>
                    )}
                  </span>
                  <span className="rounded-full bg-canvas px-2 py-0.5">
                    {Math.round(narrowed * 100)}% narrowed
                  </span>
                </div>

                <div
                  className="h-1.5 overflow-hidden rounded-full bg-line"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(narrowed * 100)}
                >
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-300"
                    style={{ width: `${Math.max(4, narrowed * 100)}%` }}
                  />
                </div>

                <p className="pt-2 text-[20px] font-medium leading-8 text-ink">
                  {question.question}
                </p>
                <p className="text-[13px] text-muted">
                  Yes would remove about {question.eliminates_if_yes.toLocaleString()}
                  ; no about {question.eliminates_if_no.toLocaleString()}.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => answer(true)}
                    className="rounded-md bg-accent px-5 py-2.5 text-[14px] font-medium text-white hover:bg-accent-hover"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => answer(false)}
                    className="rounded-md border border-line px-5 py-2.5 text-[14px] font-medium text-ink hover:border-accent/40"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('results')}
                    className="px-4 py-2.5 text-[14px] text-muted hover:text-ink"
                  >
                    Not sure
                  </button>
                </div>

                {answeredCount > 0 && (
                  <ul className="flex flex-wrap gap-2 pt-2">
                    {Object.entries(facts).map(([key, has]) => (
                      <li
                        key={key}
                        className="rounded-full bg-canvas px-2.5 py-1 text-[12px] text-muted"
                      >
                        {factLabel(key)}: {has ? 'yes' : 'no'}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 py-12 text-[14px] text-muted">
                <Loader2 size={16} className="animate-spin" /> Building your
                shortlist…
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: the shortlist ─────────────────────────────────────── */}
        {step === 'results' && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-[19px] font-semibold text-ink">
                  {listLoading && !data
                    ? 'Building your shortlist…'
                    : data
                      ? `${data.totalCount.toLocaleString()} ${
                          data.totalCount === 1 ? 'study is' : 'studies are'
                        } relevant`
                      : 'No shortlist yet'}
                </h3>
                <p className="mt-1 text-[13px] text-muted">
                  {shortlist.length > 0 && (
                    <>Showing the first {shortlist.length}. </>
                  )}
                  A badge reflects the registry&apos;s listed criteria, not a
                  decision.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep('about')}
                  className="flex items-center gap-1 rounded-md border border-line px-3 py-2 text-[13px] text-ink hover:border-accent/40"
                >
                  <ArrowLeft size={15} /> Adjust
                </button>
                {localAnswers.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAnswers}
                    className="rounded-md px-3 py-2 text-[13px] text-muted hover:text-ink"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => apply(variant === 'page')}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-white hover:bg-accent-hover"
                >
                  <Check size={15} />
                  {variant === 'dialog' ? 'Apply to search' : 'Open in search'}
                </button>
              </div>
            </div>

            {listError && (
              <p className="mt-4 rounded-md border border-warn bg-warn-soft px-4 py-2 text-[13px] text-warn">
                Could not load the shortlist. {(listError as Error).message}
              </p>
            )}

            {!listLoading && data && shortlist.length === 0 && (
              <div className="mt-4 rounded-xl border border-line bg-surface p-8 text-center">
                <p className="text-[16px] font-medium text-ink">
                  Nothing matches all of that.
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  That can happen with a narrow condition or an unusual
                  combination. Going back and relaxing one answer is usually
                  enough.
                </p>
              </div>
            )}

            <ul
              className={`mt-4 grid gap-3 ${
                variant === 'page' ? 'sm:grid-cols-2' : ''
              }`}
            >
              {shortlist.map((trial) => (
                <li key={trial.id}>
                  <TrialCard trial={trial} />
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[12px] leading-5 text-muted">
              Every row is a live ClinicalTrials.gov record. We do not generate
              studies, and we cannot tell you that you are eligible — the study
              team decides after tests this questionnaire cannot perform.
            </p>
          </div>
        )}
      </div>

      {step === 'about' && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          <p className="max-w-[46%] text-[12px] leading-5 text-muted">
            Screening aid only. These answers are not medical advice and are not
            stored.
          </p>
          <button
            type="button"
            onClick={continueToQuestions}
            className="flex shrink-0 items-center gap-2 rounded-md bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover"
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 'questions' && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={() => setStep('about')}
            className="flex items-center gap-1 rounded-md px-2 py-2 text-[13px] text-muted hover:text-ink"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            type="button"
            onClick={() => setStep('results')}
            className="rounded-md px-3 py-2 text-[13px] text-muted hover:text-ink"
          >
            Skip to shortlist
          </button>
        </div>
      )}
    </div>
  );
}
