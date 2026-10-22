// components/trial/TrialCard.tsx
//
// The card is the unit of the product, so it carries the four things a patient
// actually decides on: how far away it is, who it is for, whether it is still
// enrolling, and what it is. The previous version showed status, title, sponsor
// and phase pills — three of which are decoration — and omitted every one of the
// decision fields even though the API returns them.
import React from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { Trial } from '@/lib/api-client';
import { useTrialStore } from '@/stores/trialStore';
import { FitBadge } from '@/components/trial/FitBadge';
import { ageLabel, sexLabel, statusTone } from '@/lib/trial-display';

type TrialCardProps = {
  trial: Trial;
  /** Single click: open the detail modal. */
  onOpen?: (trial: Trial) => void;
};

function haversineMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const TrialCard: React.FC<TrialCardProps> = ({ trial, onOpen }) => {
  const { id, title, acronym, status, sponsor, phases } = trial;
  const userLocation = useTrialStore((s) => s.userLocation);

  const tone = statusTone(status);
  const locs = trial.locations ?? [];

  // Nearest site. Without a location fix we show the first place, which is still
  // more useful than nothing; with one, the closest wins.
  //
  // `city` is only trustworthy when the geocoder actually resolved a city or a
  // postal code. At admin1/country precision the parser may have parked a
  // facility name there ("Tenax Investigational Site"), and printing that where a
  // city belongs is worse than printing the country.
  let nearest: { miles: number | null; place: string } | null = null;
  for (const loc of locs) {
    const trustworthy = loc.precision === 'postal' || loc.precision === 'city';
    const place = (trustworthy ? loc.city : null) ?? loc.countryCode ?? null;
    if (!place) continue;
    const miles = userLocation ? haversineMiles(userLocation, loc) : null;
    if (!nearest) {
      nearest = { miles, place };
      continue;
    }
    if (miles != null && (nearest.miles == null || miles < nearest.miles)) {
      nearest = { miles, place };
    }
  }

  const placeLabel = nearest
    ? nearest.miles != null
      ? `${nearest.miles < 10 ? nearest.miles.toFixed(1) : Math.round(nearest.miles)} mi · ${nearest.place}`
      : nearest.place
    : null;

  const eligibility = [ageLabel(trial.minAgeYears, trial.maxAgeYears), sexLabel(trial.sex)]
    .filter(Boolean)
    .join(' · ');

  const siteCount = locs.length;
  const phaseLabel = phases.length ? phases.join(' / ') : null;

  return (
    <div
      className={`group flex h-full flex-col rounded-xl border border-line bg-surface p-5
                 transition duration-150 ease-out hover:-translate-y-px hover:shadow-[var(--shadow-lift)]
                 ${onOpen ? 'cursor-pointer' : ''}`}
      onClick={onOpen ? () => onOpen(trial) : undefined}
      onKeyDown={
        onOpen
          ? (e) => {
              // Only when the card itself has focus. Enter on the "View trial"
              // link must follow the link, not open this modal as well.
              if (e.target !== e.currentTarget) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(trial);
              }
            }
          : undefined
      }
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      title={onOpen ? 'View details' : undefined}
    >
      {/* Status and shape, at a glance */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden />
        <span className={`font-medium ${tone.text}`}>{status}</span>
        {phaseLabel && (
          <>
            <span className="text-line" aria-hidden>·</span>
            <span className="text-muted">{phaseLabel}</span>
          </>
        )}
        {siteCount > 0 && (
          <>
            <span className="text-line" aria-hidden>·</span>
            <span className="text-muted">
              {siteCount} {siteCount === 1 ? 'site' : 'sites'}
            </span>
          </>
        )}
      </div>

      {/* Title: two lines hard-clamped. Registry titles run to 200 characters. */}
      <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold leading-snug text-ink">
        {title}
        {acronym && <span className="font-normal text-muted"> ({acronym})</span>}
      </h3>

      <p className="mt-1 truncate text-[13px] text-muted">{sponsor}</p>

      {placeLabel && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-muted">
          <MapPin size={14} className="shrink-0" aria-hidden />
          {placeLabel}
        </p>
      )}

      {/* The decision row: who it is for, how it reads against the answers, and
          the one action. The badge only appears once the reader has answered
          something, because a "fit" with nothing to fit against is noise. */}
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
        <div className="min-w-0">
          {trial.fit && <FitBadge fit={trial.fit} className="mb-1.5" />}
          <span className="block truncate text-[13px] text-muted">
            {eligibility || 'Eligibility not listed'}
          </span>
        </div>
        <Link
          href={`https://clinicaltrials.gov/study/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded-md px-1 text-[13px] font-medium text-accent
                     transition-colors hover:text-accent-hover"
        >
          View trial
        </Link>
      </div>
    </div>
  );
};
