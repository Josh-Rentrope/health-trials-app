import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * The landing page leads with the funnel, not the catalogue.
 *
 * "607,000 studies" is a better stat than a promise, but a terrible product:
 * nobody wants 607,000 rows. The primary action is therefore the questionnaire;
 * browsing the full registry is the secondary, deliberate choice.
 */
export const Hero = () => {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-[13px] font-medium uppercase tracking-wider text-accent">
            Clinical trial search
          </p>
          <h1 className="mt-3 text-[40px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[56px]">
            Find studies you might actually qualify for.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-7 text-muted">
            Search 607,000+ live registry records by condition and location, then
            answer a few questions to see which are relevant. No account, no
            invented trials, no diagnosis.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
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

          <p className="mt-4 text-[13px] text-muted">
            A screening aid, not a medical decision. The study team makes the final
            call.
          </p>
        </div>
      </div>
    </section>
  );
};
