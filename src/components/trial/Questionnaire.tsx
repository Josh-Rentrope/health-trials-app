'use client';

// Questionnaire.tsx
//
// A short conversation that turns a reader into a filtered result set.
//
// The design constraint is that it must not feel like a form. Two of the four
// steps are a single form (age, sex, healthy volunteer) because those are
// standardised fields where a form is genuinely better than a question; the
// rest is one question at a time, chosen by the server from what actually
// splits the remaining candidates. That split is entropy over
// requires/excludes/silent, so the order the questions arrive in is not
// arbitrary and does not need to be hardcoded here.
//
// Nothing is applied until the reader presses the final button. Answers live in
// this component until then, which means closing the dialog leaves their
// results exactly as they were.
//
// Wording matters more than usual here. The API never says "you are eligible"
// and neither does this: it says which studies remain and lets the reader decide.

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X, Loader2, ArrowLeft, Check } from 'lucide-react';

import { useTrialStore } from '@/stores/trialStore';
import { useNextQuestion, factLabel } from '@/lib/use-eligibility';

type Step = 'demographics' | 'questions' | 'done';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SEX_LABEL: Record<string, string> = {
  female: 'Female',
  male: 'Male',
  all: 'All',
};

export function Questionnaire({ open, onClose }: Props) {
  const filters = useTrialStore((s) => s.filters);
  const setFilters = useTrialStore((s) => s.setFilters);
  const setPagination = useTrialStore((s) => s.setPagination);

  const [step, setStep] = useState<Step>('demographics');
  const [ageInput, setAgeInput] = useState('');
  const [sex, setSex] = useState<'' | 'female' | 'male'>('');
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [facts, setFacts] = useState<Record<string, boolean>>({});
  const [asked, setAsked] = useState<string[]>([]);

  // Reopening starts from whatever is already applied, so the dialog reflects
  // the results rather than contradicting them.
  useEffect(() => {
    if (!open) return;
    setStep('demographics');
    setAgeInput(typeof filters.age === 'number' ? String(filters.age) : '');
    setSex(filters.sex ?? '');
    setHealthy(filters.healthyVolunteer ?? null);
    setFacts(filters.facts ?? {});
    setAsked([]);
    // Only on open: filters change while the dialog is closed must not retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const age = useMemo(() => {
    const n = Number.parseInt(ageInput, 10);
    return Number.isFinite(n) && n > 0 && n <= 120 ? n : null;
  }, [ageInput]);

  const answers = useMemo(
    () => ({ age, sex: sex || null, healthyVolunteer: healthy, facts }),
    [age, sex, healthy, facts],
  );

  const { question, total: remaining, hasLoaded, isFetching, error } = useNextQuestion(
    filters.condition,
    filters.status.join(','),
    answers,
    open && step === 'questions',
  );

  // The loop ends when the server has nothing left to ask, when the pool is
  // empty, or when the same question would come back (which can happen if a
  // future matcher returns one we have already answered).
  useEffect(() => {
    if (step !== 'questions' || !hasLoaded) return;
    if (!question) {
      setStep('done');
      return;
    }
    if (asked.includes(question.key)) setStep('done');
  }, [hasLoaded, question, step, asked]);

  if (!open) return null;

  const answer = (has: boolean) => {
    if (!question) return;
    setFacts((prev) => ({ ...prev, [question.key]: has }));
    setAsked((prev) => [...prev, question.key]);
  };

  // "Not sure" is not a third answer. Recording it as one would filter on a
  // fact the reader does not have, which is worse than asking nothing. It ends
  // the questions and shows what has been established so far.
  const notSure = () => setStep('done');

  const apply = () => {
    setFilters({
      age,
      sex: sex || null,
      healthyVolunteer: healthy,
      facts,
    });
    setPagination({ page: 0 });
    onClose();
  };

  const clear = () => {
    setFilters({ age: null, sex: null, healthyVolunteer: null, facts: {} });
    setPagination({ page: 0 });
    onClose();
  };

  const questionCount = asked.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="questionnaire-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="flex w-full max-w-lg flex-col rounded-t-2xl bg-surface shadow-lift sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent" aria-hidden />
            <h2 id="questionnaire-title" className="text-[17px] font-semibold text-ink">
              {step === 'demographics'
                ? 'Find studies that fit you'
                : step === 'questions'
                  ? 'A few quick questions'
                  : 'Ready to filter'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-md p-2 text-muted hover:bg-canvas hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {step === 'demographics' && (
            <div className="space-y-5">
              <p className="text-[14px] leading-6 text-muted">
                This narrows the {remaining ? remaining.toLocaleString() : ''} studies
                already on the page. It is not a medical assessment and nothing is
                saved.
              </p>

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
                  Used to drop studies restricted to the other sex. Leave blank if you
                  would rather not say.
                </p>
              </fieldset>

              <fieldset>
                <legend className="mb-1.5 text-[13px] font-medium text-ink">
                  Do you have a diagnosis being studied?
                </legend>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHealthy(healthy === true ? null : true)}
                    aria-pressed={healthy === true}
                    className={`flex-1 rounded-md border px-3 py-2 text-[14px] ${
                      healthy === true
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line text-ink hover:border-accent/40'
                    }`}
                  >
                    No, I am healthy
                  </button>
                  <button
                    type="button"
                    onClick={() => setHealthy(healthy === false ? null : false)}
                    aria-pressed={healthy === false}
                    className={`flex-1 rounded-md border px-3 py-2 text-[14px] ${
                      healthy === false
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line text-ink hover:border-accent/40'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </fieldset>
            </div>
          )}

          {step === 'questions' && (
            <div className="space-y-4">
              {isFetching && !hasLoaded ? (
                <div className="flex items-center gap-2 py-10 text-[14px] text-muted">
                  <Loader2 size={16} className="animate-spin" />
                  Checking what fits…
                </div>
              ) : error ? (
                <p className="py-6 text-[14px] text-warn">
                  Could not load the next question. {(error as Error).message}
                </p>
              ) : question ? (
                <>
                  <div className="flex items-center justify-between text-[12px] text-muted">
                    <span>
                      Question {questionCount + 1}
                      {remaining !== null && <> · {remaining.toLocaleString()} studies left</>}
                    </span>
                  </div>
                  <p className="text-[16px] leading-7 text-ink">{question.question}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => answer(true)}
                      className="rounded-md bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => answer(false)}
                      className="rounded-md border border-line px-4 py-2 text-[14px] font-medium text-ink hover:border-accent/40"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={notSure}
                      className="px-3 py-2 text-[14px] text-muted hover:text-ink"
                    >
                      Not sure
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <p className="text-[14px] leading-6 text-muted">
                {remaining === null
                  ? 'Answer as much as you like.'
                  : remaining === 0
                    ? 'Nothing in the current search matches all of that. You can go back and change an answer.'
                    : `${remaining.toLocaleString()} ${
                        remaining === 1 ? 'study matches' : 'studies match'
                      } everything you told us.`}
              </p>
              <ul className="space-y-1.5 rounded-md bg-canvas p-3 text-[13px] text-ink">
                {age !== null && <li>Age {age}</li>}
                {sex && <li>{SEX_LABEL[sex]}</li>}
                {healthy === true && <li>Healthy volunteer</li>}
                {healthy === false && <li>Has a diagnosis being studied</li>}
                {Object.entries(facts).map(([key, has]) => (
                  <li key={key}>
                    {factLabel(key)}: {has ? 'yes' : 'no'}
                  </li>
                ))}
                {!age && !sex && healthy === null && Object.keys(facts).length === 0 && (
                  <li className="text-muted">No answers yet.</li>
                )}
              </ul>
              <p className="text-[12px] leading-5 text-muted">
                These are registry criteria, not medical advice. A study may still
                screen you out for reasons it does not list.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          <div>
            {step !== 'demographics' && (
              <button
                type="button"
                onClick={() => setStep('demographics')}
                className="flex items-center gap-1 rounded-md px-2 py-2 text-[13px] text-muted hover:text-ink"
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
            {(filters.age || filters.sex || filters.healthyVolunteer != null ||
              Object.keys(filters.facts ?? {}).length > 0) && (
              <button
                type="button"
                onClick={clear}
                className="ml-1 rounded-md px-2 py-2 text-[13px] text-muted hover:text-ink"
              >
                Clear answers
              </button>
            )}
          </div>
          {step === 'demographics' ? (
            <button
              type="button"
              onClick={() => setStep('questions')}
              className="rounded-md bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover"
            >
              Next
            </button>
          ) : step === 'questions' ? (
            <button
              type="button"
              onClick={() => setStep('done')}
              className="rounded-md px-4 py-2 text-[14px] text-muted hover:text-ink"
            >
              Skip to results
            </button>
          ) : (
            <button
              type="button"
              onClick={apply}
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover"
            >
              <Check size={16} />
              Show matching trials
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
