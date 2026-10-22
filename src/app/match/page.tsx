// app/match/page.tsx
//
// The same RelevanceFlow the /trials dialog uses, mounted inline. Keeping one
// implementation is deliberate: the two surfaces must agree about the questions,
// the counts, and what "apply" means.

'use client';

import { RelevanceFlow } from '@/components/relevance/RelevanceFlow';

export default function MatchPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <RelevanceFlow variant="page" showCondition />
      </div>
    </div>
  );
}
