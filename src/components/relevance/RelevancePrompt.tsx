'use client';

// Shown only at the start of a conversation, and only when the reader has not
// answered the relevance questions yet. The point is to offer the funnel once,
// not to nag: dismissing it removes it for this mount.

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Questionnaire } from '@/components/trial/Questionnaire';
import { hasRelevanceAnswers } from '@/lib/relevance';
import { useTrialStore } from '@/stores/trialStore';

export function RelevancePrompt({ className = '' }: { className?: string }) {
  const filters = useTrialStore((s) => s.filters);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (hasRelevanceAnswers(filters) || dismissed) return null;

  return (
    <>
      <div
        className={`rounded-xl border border-accent/20 bg-accent-soft/60 p-4 ${className}`}
      >
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
          <Sparkles size={14} className="text-accent" aria-hidden />
          Make this conversation more relevant
        </p>
        <p className="mt-1 text-[12px] leading-5 text-muted">
          Answer a few questions and the assistant can filter trials against your
          answers instead of asking for them again.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-accent-hover"
          >
            Find relevant studies
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="px-2 py-1.5 text-[12px] text-muted hover:text-ink"
          >
            Not now
          </button>
        </div>
      </div>
      <Questionnaire open={open} onClose={() => setOpen(false)} />
    </>
  );
}
