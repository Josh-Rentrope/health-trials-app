import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

import type { StudyFit } from '@/lib/api-client';

/**
 * The fit verdict, as one scannable badge.
 *
 * The wording is the product's ethical position in miniature: "Meets listed
 * criteria" is a statement about the registry, "Check with site" is a statement
 * about what the registry does not say, and neither is a diagnosis. `title`
 * carries the reason a row was downgraded, so the badge is not a dead end.
 */
const TONE = {
  meets_listed: {
    label: 'Meets listed criteria',
    className: 'bg-good-soft text-good',
    Icon: CheckCircle2,
  },
  check_with_site: {
    label: 'Check with site',
    className: 'bg-warn-soft text-warn',
    Icon: AlertCircle,
  },
  does_not_match: {
    label: 'Does not match',
    className: 'bg-canvas text-muted',
    Icon: XCircle,
  },
} as const;

export function FitBadge({
  fit,
  className = '',
}: {
  fit: StudyFit;
  className?: string;
}) {
  const tone = TONE[fit.verdict] ?? TONE.check_with_site;
  const detail = fit.reasons.length
    ? fit.reasons.join(' · ')
    : fit.unknown_count > 0
      ? `${fit.unknown_count} listed ${
          fit.unknown_count === 1 ? 'criterion needs' : 'criteria need'
        } the study team to confirm`
      : undefined;

  return (
    <span
      title={detail}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.className} ${className}`}
    >
      <tone.Icon size={12} aria-hidden />
      {tone.label}
    </span>
  );
}
