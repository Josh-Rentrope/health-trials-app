'use client';

// The relevance answers, shown as part of the filter set rather than as a
// separate summary elsewhere. A filter you cannot see is a filter you cannot
// correct; the hover panel is the correction.

import type { MouseEvent } from 'react';
import { Sparkles } from 'lucide-react';

import { relevanceAnswers } from '@/lib/relevance';
import { useTrialStore } from '@/stores/trialStore';

export function RelevanceChip({ onEdit }: { onEdit?: () => void }) {
  const filters = useTrialStore((s) => s.filters);
  const setFilters = useTrialStore((s) => s.setFilters);
  const setPagination = useTrialStore((s) => s.setPagination);

  const answers = relevanceAnswers(filters);
  if (!answers.length) return null;

  const summary =
    answers.length <= 2
      ? answers.map((a) => a.value).join(' · ')
      : `${answers[0].value} · ${answers[1].value} · +${answers.length - 2}`;

  const clear = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
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

  return (
    <div className="group relative inline-block max-w-full">
      <button
        type="button"
        onClick={onEdit}
        aria-haspopup="dialog"
        className="flex max-w-full items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-accent transition-colors hover:border-accent/60"
      >
        <Sparkles size={13} aria-hidden />
        <span className="truncate">
          Relevance <span className="font-normal">· {summary}</span>
        </span>
      </button>

      {/* Visible on hover and on keyboard focus, so it is not mouse-only. */}
      <div className="invisible absolute left-0 top-full z-30 mt-2 w-72 rounded-lg border border-line bg-surface p-3 opacity-0 shadow-lift transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Your answers
        </p>
        <ul className="mt-2 space-y-1">
          {answers.map((a) => (
            <li
              key={a.label}
              className="flex items-baseline justify-between gap-3 text-[12px]"
            >
              <span className="text-muted">{a.label}</span>
              <span className="text-right text-ink">{a.value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-line pt-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-[12px] font-medium text-accent hover:underline"
          >
            Edit answers
          </button>
          <button
            type="button"
            onClick={clear}
            className="text-[12px] text-muted hover:text-ink"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
