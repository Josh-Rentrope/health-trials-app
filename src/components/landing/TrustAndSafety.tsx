import { DatabaseZap, Lock, ShieldCheck } from 'lucide-react';

/**
 * Trust, as three specific claims.
 *
 * The previous section made generic promises ("your data stays yours", "verified
 * trials"). Specific claims are both more credible and more falsifiable, which is
 * the point: each of these is a property of how the product is built.
 */
export const TrustAndSafety = () => {
  const claims = [
    {
      icon: <DatabaseZap className="h-5 w-5" />,
      title: 'Every trial is a real registry record',
      body: 'Records come from ClinicalTrials.gov. We never generate, paraphrase, or invent a study — if it is not in the registry, it is not here.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Screening, not a diagnosis',
      body: 'We show which listed criteria you meet and which the registry leaves unstated. Eligibility is decided by the study team after tests no questionnaire can perform.',
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Your answers stay in this browser',
      body: 'The questionnaire runs against a public registry. No account, no profile, and no answers stored on the server.',
    },
  ];

  return (
    <section className="border-b border-line bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-accent">
            What this is
          </h2>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]">
            Three things you can check
          </p>
        </div>

        <dl className="mt-10 grid gap-6 md:grid-cols-3">
          {claims.map((claim) => (
            <div
              key={claim.title}
              className="rounded-xl border border-line bg-white p-6"
            >
              <dt className="flex items-start gap-3 text-[16px] font-semibold leading-6 text-ink">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                  {claim.icon}
                </span>
                {claim.title}
              </dt>
              <dd className="mt-3 text-[14px] leading-6 text-muted">{claim.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
