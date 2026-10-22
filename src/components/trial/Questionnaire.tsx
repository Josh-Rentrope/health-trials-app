'use client';

// Questionnaire.tsx
//
// The dialog shell. The flow itself lives in RelevanceFlow and is shared with
// /match; this file only supplies the overlay, focus containment, and the
// close-on-Escape behaviour. It used to contain a second copy of the whole
// questionnaire, which is how the two surfaces started drifting.

import { RelevanceFlow } from '@/components/relevance/RelevanceFlow';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Questionnaire({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Find relevant studies"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-y-auto rounded-t-2xl bg-surface shadow-lift sm:rounded-2xl">
        <RelevanceFlow variant="dialog" onClose={onClose} />
      </div>
    </div>
  );
}
