'use client';

// The detail view behind a card click. It answers the questions the card has no
// room for -- condition, planned enrolment, every listed site -- and makes the
// two next actions explicit: show it on the map, or open the registry record.

import { useEffect } from 'react';
import { ExternalLink, MapPin, X } from 'lucide-react';

import type { Trial } from '@/lib/api-client';
import { FitBadge } from '@/components/trial/FitBadge';
import { ageLabel, sexDescription, statusTone } from '@/lib/trial-display';

interface Props {
  trial: Trial | null;
  onClose: () => void;
  onViewOnMap?: (trial: Trial) => void;
}

function placeOf(trial: Trial): string | null {
  for (const loc of trial.locations ?? []) {
    const trustworthy = loc.precision === 'postal' || loc.precision === 'city';
    const place = (trustworthy ? loc.city : null) ?? loc.countryCode ?? null;
    if (place) return place;
  }
  return null;
}

export function TrialDetailModal({ trial, onClose, onViewOnMap }: Props) {
  useEffect(() => {
    if (!trial) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [trial, onClose]);

  if (!trial) return null;

  const {
    id,
    title,
    acronym,
    status,
    sponsor,
    phases,
    conditions,
    enrollmentCount,
    minAgeYears,
    maxAgeYears,
    sex,
    healthyVolunteers,
    fit,
    locations,
  } = trial;

  const tone = statusTone(status);
  const places = locations ?? [];
  const place = placeOf(trial);
  const age = ageLabel(minAgeYears, maxAgeYears);

  const eligibility = [
    age ? `Age ${age}` : null,
    sexDescription(sex),
    healthyVolunteers === true
      ? 'Healthy volunteers accepted'
      : healthyVolunteers === false
        ? 'Healthy volunteers not accepted'
        : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const conditionText = conditions
    ? conditions.split('|').map((c) => c.trim()).filter(Boolean).join(', ')
    : null;

  const typeLabel =
    healthyVolunteers === false ? 'Patients being studied' : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-[var(--shadow-lift)] sm:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-4">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
              <span
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${tone.dot}`}
                aria-hidden
              />
              <span className={`font-medium ${tone.text}`}>{status}</span>
              {phases.length > 0 && (
                <>
                  <span className="text-line" aria-hidden>·</span>
                  <span className="text-muted">{phases.join(' / ')}</span>
                </>
              )}
              {typeLabel && (
                <>
                  <span className="text-line" aria-hidden>·</span>
                  <span className="text-muted">{typeLabel}</span>
                </>
              )}
            </p>
            <h2
              id="trial-detail-title"
              className="mt-1 text-[19px] font-semibold leading-snug text-ink"
            >
              {title}
            </h2>
            {acronym && <p className="mt-0.5 text-[12px] text-muted">{acronym}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 shrink-0 rounded-md p-2 text-muted hover:bg-canvas hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-5 px-6 py-5">
          {fit && <FitBadge fit={fit} />}

          {fit?.reasons.length ? (
            <div className="rounded-md border border-warn/30 bg-warn-soft p-3 text-[12px] leading-5 text-warn">
              <p className="font-medium">Why this may not match</p>
              <ul className="mt-1 list-disc pl-4">
                {fit.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {fit?.verdict === 'check_with_site' && (
            <p className="text-[12px] leading-5 text-muted">
              {fit.unknown_count > 0
                ? `${fit.unknown_count} listed ${
                    fit.unknown_count === 1 ? 'criterion needs' : 'criteria need'
                  } the study team to confirm.`
                : 'The registry leaves some criteria unstated.'}
            </p>
          )}

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">
                Sponsor
              </dt>
              <dd className="mt-0.5 text-ink">{sponsor}</dd>
            </div>
            {conditionText && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted">
                  Condition
                </dt>
                <dd className="mt-0.5 text-ink">{conditionText}</dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">
                Planned enrolment
              </dt>
              <dd className="mt-0.5 text-ink">
                {enrollmentCount != null
                  ? `${enrollmentCount.toLocaleString()} participants`
                  : 'Not listed'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">
                Eligibility
              </dt>
              <dd className="mt-0.5 text-ink">{eligibility || 'Not listed'}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">
                Sites
              </dt>
              <dd className="mt-0.5 text-ink">
                {places.length > 0
                  ? `${places.length} listed${place ? ` · ${place}` : ''}`
                  : 'Not listed'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted">
                Registry ID
              </dt>
              <dd className="mt-0.5 font-mono text-[12px] text-ink">{id}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {onViewOnMap && places.length > 0 && (
              <button
                type="button"
                onClick={() => onViewOnMap(trial)}
                className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-white hover:bg-accent-hover"
              >
                <MapPin size={15} aria-hidden />
                View on map
              </button>
            )}
            <a
              href={`https://clinicaltrials.gov/study/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[13px] font-medium text-ink hover:border-accent/40"
            >
              View trial <ExternalLink size={14} aria-hidden />
            </a>
          </div>

          <p className="text-[12px] leading-5 text-muted">
            Registry information only. This is not medical advice, and eligibility
            is decided by the study team after tests this page cannot perform.
          </p>
        </div>
      </div>
    </div>
  );
}
