'use client';

// An NCT number in a chat message, as a badge with a small detail popover.
//
// The popover is portalled and positioned from the badge's own rect, so it
// always lands inside the viewport: to the right when there is room, to the
// left otherwise, and shifted up if it would run off the bottom.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Info, MapPin, X } from 'lucide-react';

import {
  fetchTrialDetail,
  trialFromDetail,
  type TrialDetail,
} from '@/lib/api-client';
import { useTrialStore } from '@/stores/trialStore';

interface Props {
  nct: string;
  /** Text from the line beside the badge, e.g. "Bradenton, FL · 0.0 mi". */
  context?: string;
}

interface Position {
  left: number;
  top: number;
  width: number;
}

export function TrialBadge({ nct, context }: Props) {
  const router = useRouter();
  const setFocusTrial = useTrialStore((s) => s.setFocusTrial);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);

  const { data } = useQuery<TrialDetail>({
    queryKey: ['trial-detail', nct],
    queryFn: () => fetchTrialDetail(nct),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const openPopover = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 8;
    const width = Math.min(320, window.innerWidth - gap * 2);
    let left = rect.right + gap;
    if (left + width > window.innerWidth - gap) {
      left = rect.left - width - gap;
    }
    if (left < gap) left = gap;
    let top = rect.top;
    const maxTop = window.innerHeight - 280;
    if (top > maxTop) top = Math.max(gap, maxTop);
    setPos({ left, top, width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const viewOnMap = () => {
    if (!data) return;
    setFocusTrial(trialFromDetail(data));
    setOpen(false);
    router.push('/trials');
  };

  const meta = [data?.status, data?.phase].filter(Boolean).join(' · ');

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPopover())}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={data?.study_title ?? nct}
        className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent transition-colors hover:border-accent/60"
      >
        <Info size={12} aria-hidden />
        {nct}
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label={`Trial ${nct}`}
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: 'min(320px, calc(100vh - 16px))',
            }}
            className="z-[60] overflow-y-auto rounded-xl border border-line bg-surface p-3 text-left shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
                  {data?.study_title ?? nct}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {meta || 'Trial record'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-1 shrink-0 rounded-md p-1 text-muted hover:bg-canvas hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>

            {context && (
              <p className="mt-2 text-[12px] leading-5 text-muted">{context}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-2">
              {data && data.locations.length > 0 && (
                <button
                  type="button"
                  onClick={viewOnMap}
                  className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-accent-hover"
                >
                  <MapPin size={13} aria-hidden />
                  View on map
                </button>
              )}
              <a
                href={`https://clinicaltrials.gov/study/${nct}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink hover:border-accent/40"
              >
                View case <ExternalLink size={12} aria-hidden />
              </a>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
