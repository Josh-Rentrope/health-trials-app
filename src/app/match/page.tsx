// app/match/page.tsx
//
// The questionnaire as a page rather than a dialog: three steps, one decision per
// screen, and a shortlist that carries a fit badge on every row.
//
// Two things are deliberate. First, nothing is applied to the shared filter state
// until the reader asks for it -- closing the page leaves /trials exactly as it
// was. Second, the questions come from the server one at a time: which question is
// worth asking depends on how the remaining candidates split, so it cannot be a
// hardcoded list.
//
// The count under each step is the same number the list will report after the
// answers are applied. That is checked against /studies, not inferred.

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';

import { TrialCard } from '@/components/trial/TrialCard';
import { fetchTrialsFromApi, Trial } from '@/lib/api-client';
import { useNextQuestion, factLabel } from '@/lib/use-eligibility';
import { useTrialStore } from '@/stores/trialStore';

type Step = 'about' | 'questions' | 'results';

const SHORTLIST_SIZE = 25;

const SEX_LABEL = { female: 'Female', male: 'Male' } as const;

/** Rank for sorting: a study that conflicts should never outrank one that fits. */
const FIT_RANK: Record<string, number> = {
  meets_listed: 0,
  check_with_site: 1,
  does_not_match: 2,
};

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ['about', 'questions', 'results'];
  const index = order.indexOf(step);
  return (
    <ol className="flex items-center gap-2" aria-label={`Step ${index + 1} of 3`}>
      {order.map((s, i) => (
        <li
          key={s}
          className={
            'h-1.5 rounded-full transition-colors ' +
            (i <= index ? 'w-10 bg-accent' : 'w-6 bg-line')
          }
          aria-hidden
        />
      ))}
    </ol>
  );
}

export default function MatchPage() {
  const router = useRouter();
  const setFilters = useTrialStore((s) => s.setFilters);
  const setPagination = useTrialStore((s) => s.setPagination);

  const [step, setStep] = useState<Step>('about');
  const [condition, setCondition] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [sex, setSex] = useState<'' | 'female' | 'male'>('');
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [facts, setFacts] = useState<Record<string, boolean>>({});
  const [asked, setAsked] = useState<string[]>([]);

  const age = useMemo(() => {
    const n = Number.parseInt(ageInput, 10);
    return Number.isFinite(n) && n > 0 && n <= 120 ? n : null;
  }, [ageInput]);

  const answers = useMemo(
    () => ({ age, sex: sex || null, healthyVolunteer: healthy, facts }),
    [age, sex, healthy, facts],
  );

  const { question, total, hasLoaded, isFetching, error } = useNextQuestion(
    condition || undefined,
    undefined,
    answers,
    step === 'questions',
  );

  // The loop ends when the server has nothing left to ask, when the pool is
  // empty, or when a question would repeat. Repeating one would be a dead end
  // the reader cannot get out of.
  useEffect(() => {
    if (step !== 'questions' || !hasLoaded) return;
    if (!question || asked.includes(question.key)) setStep('results');
  }, [step, hasLoaded, question, asked]);

  const filters = useMemo(
    () => ({
      condition: condition || undefined,
      age,
      sex: sex || null,
      healthyVolunteer: healthy,
      facts,
      page: 0,
      limit: SHORTLIST_SIZE,
    }),
    [condition, age, sex, healthy, facts],
  );

  const {
    data,
    isFetching: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ['match-shortlist', filters],
    queryFn: () => fetchTrialsFromApi(filters),
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

  const startOver = () => {
    setFacts({});
    setAsked([]);
    setStep('about');
  };

  const applyToSearch = () => {
    setFilters({
      condition: condition,
      age,
      sex: sex || null,
      healthyVolunteer: healthy,
      facts,
    });
    setPagination({ page: 0 });
    router.push('/trials');
  };

  const answeredCount = asked.length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-[28px] font-semibold tracking-tight text-ink">
              <Sparkles size={22} className="text-accent" aria-hidden />
              Find studies that fit
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              {step === 'about'
                ? 'Step 1 of 3 · About you'
                : step === 'questions'
                  ? 'Step 2 of 3 · A few questions'
                  : 'Step 3 of 3 · Your shortlist'}
            </p>
          </div>
          <StepDots step={step} />
        </div>
      </header>

      {/* ── Step 1: structured fields ─────────────────────────────────────── */}
      {step === 'about' && (
        <section className="rounded-xl border border-line bg-surface p-6 shadow-none sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">
                Condition or keywords <span className="font-normal text-muted">(optional)</span>
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

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Age</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="e.g. 54"
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[15px] text-ink outline-none focus:border-accent"
              />
            </label>

            <fieldset>
              <legend className="mb-1.5 text-[13px] font-medium text-ink">Sex</legend>
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
                    {SEX_LABEL[value]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                Drops studies restricted to the other sex. Leave blank if you would
                rather not say.
              </p>
            </fieldset>

            <fieldset className="md:col-span-2">
              <legend className="mb-1.5 text-[13px] font-medium text-ink">
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
                  Yes
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
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                Treatment studies usually do not accept healthy volunteers; saying
                you are healthy removes them.
              </p>
            </fieldset>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-[12px] leading-5 text-muted">
              Screening aid only. These answers are not medical advice and are never
              stored.
            </p>
            <button
              type="button"
              onClick={() => setStep('questions')}
              className="flex shrink-0 items-center gap-2 rounded-md bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* ── Step 2: one question at a time ─────────────────────────────────── */}
      {step === 'questions' && (
        <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
          {isFetching && !hasLoaded ? (
            <div className="flex items-center gap-2 py-16 text-[14px] text-muted">
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
                  {total !== null && <> · {total.toLocaleString()} studies left</>}
                </span>
                <span className="rounded-full bg-canvas px-2 py-0.5">
                  {question.split.requires > 0 && (
                    <>{question.split.requires.toLocaleString()} require it · </>
                  )}
                  {question.split.excludes.toLocaleString()} exclude it
                </span>
              </div>

              <p className="mt-4 text-[20px] font-medium leading-8 text-ink">
                {question.question}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
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
                <ul className="mt-6 flex flex-wrap gap-2">
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
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
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
        </section>
      )}

      {/* ── Step 3: the shortlist ─────────────────────────────────────────── */}
      {step === 'results' && (
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-semibold text-ink">
                {listLoading && !data
                  ? 'Building your shortlist…'
                  : data
                    ? `${data.totalCount.toLocaleString()} ${
                        data.totalCount === 1 ? 'study matches' : 'studies match'
                      } everything you told us`
                    : 'No shortlist yet'}
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                Showing the first {Math.min(SHORTLIST_SIZE, shortlist.length)}. A
                badge reflects the registry&apos;s listed criteria, not a decision.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startOver}
                className="flex items-center gap-1 rounded-md border border-line px-3 py-2 text-[13px] text-ink hover:border-accent/40"
              >
                <ArrowLeft size={15} /> Adjust answers
              </button>
              <button
                type="button"
                onClick={applyToSearch}
                className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-white hover:bg-accent-hover"
              >
                <Check size={15} /> Open in full search
              </button>
            </div>
          </div>

          {listError && (
            <p className="mb-4 rounded-md border border-warn bg-warn-soft px-4 py-2 text-[13px] text-warn">
              Could not load the shortlist. {(listError as Error).message}
            </p>
          )}

          {!listLoading && data && shortlist.length === 0 && (
            <div className="rounded-xl border border-line bg-surface p-8 text-center">
              <p className="text-[16px] font-medium text-ink">
                Nothing matches all of that.
              </p>
              <p className="mt-1 text-[13px] text-muted">
                That can happen with a narrow condition or an unusual combination.
                Going back and relaxing one answer is usually enough.
              </p>
            </div>
          )}

          <ul className="grid gap-4 sm:grid-cols-2">
            {shortlist.map((trial) => (
              <li key={trial.id}>
                <TrialCard trial={trial} />
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[12px] leading-5 text-muted">
            Every row is a live ClinicalTrials.gov record. We do not generate
            studies, and we cannot tell you that you are eligible — the study team
            decides after tests this questionnaire cannot perform. See{' '}
            <Link href="/chat" className="text-accent hover:underline">
              the assistant
            </Link>{' '}
            if you want to talk through a specific study.
          </p>
        </section>
      )}
    </div>
  );
}
