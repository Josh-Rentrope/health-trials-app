import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const FinalCTA = () => {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]">
              Not sure where to start?
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-muted">
              Answer a few questions and we will show you the studies that remain
              — and be plain about what the registry does not tell us.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/match"
              className="flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Sparkles size={17} aria-hidden />
              Find relevant studies
              <ArrowRight size={17} aria-hidden />
            </Link>
            <Link
              href="/trials"
              className="rounded-md border border-line px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:border-accent/40"
            >
              Browse all trials
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
