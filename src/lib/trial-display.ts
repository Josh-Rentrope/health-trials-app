// Presentation helpers shared by the card and the detail modal. Keeping them
// here means the two surfaces cannot describe the same registry field
// differently.

/**
 * Status colour. Recruiting is the only state worth a positive colour; anything
 * that is not currently enrolling is deliberately grey, because a green badge on
 * a terminated trial would be actively misleading.
 */
export function statusTone(status: string): { dot: string; text: string } {
  const s = status.toLowerCase();
  if (s.includes('recruiting') && !s.includes('not yet') && !s.includes('not recruiting')) {
    return { dot: 'bg-good', text: 'text-good' };
  }
  if (s.includes('active')) return { dot: 'bg-accent', text: 'text-accent' };
  if (s.includes('not yet') || s.includes('enrolling')) {
    return { dot: 'bg-warn', text: 'text-warn' };
  }
  return { dot: 'bg-muted/40', text: 'text-muted' };
}

/** "18+", "18–75", "up to 75", or null when the registry states neither. */
export function ageLabel(
  minAge?: number | null,
  maxAge?: number | null,
): string | null {
  if (minAge != null && maxAge != null) return `${minAge}–${maxAge}`;
  if (minAge != null) return `${minAge}+`;
  if (maxAge != null) return `up to ${maxAge}`;
  return null;
}

/** Null for ALL and for an unstated value; the card suppresses both. */
export function sexLabel(sex?: string | null): string | null {
  if (!sex) return null;
  const s = sex.toUpperCase();
  if (s === 'FEMALE') return 'Women only';
  if (s === 'MALE') return 'Men only';
  return null;
}

/** A complete description, for the detail modal where "All sexes" is useful. */
export function sexDescription(sex?: string | null): string {
  if (!sex) return 'Not listed';
  const s = sex.toUpperCase();
  if (s === 'FEMALE') return 'Women only';
  if (s === 'MALE') return 'Men only';
  if (s === 'ALL') return 'All sexes';
  return sex;
}
