import { ClipboardList, ListChecks, Stethoscope } from 'lucide-react';

/**
 * Three steps, in the order the product actually works.
 *
 * The previous copy described "discover, evaluate, connect" in the abstract.
 * This says what the reader does on the next screen, which is the only thing a
 * three-step strip is for.
 */
export const HowItWorks = () => {
  const steps = [
    {
      icon: <ClipboardList className="h-6 w-6" />,
      title: 'Tell us about you',
      description:
        'Age, sex, and whether you have a diagnosis being studied. Three fields, no account.',
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: 'Answer a few questions',
      description:
        'Each question is chosen because it narrows your remaining studies the most — not because it is on a form.',
    },
    {
      icon: <Stethoscope className="h-6 w-6" />,
      title: 'Talk to the study team',
      description:
        'Your shortlist shows what the registry lists and what it does not. The team confirms the rest.',
    },
  ];

  return (
    <section className="border-b border-line bg-canvas py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-accent">
            How it works
          </h2>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]">
            Three steps, about two minutes
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-line bg-surface p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent">
                {step.icon}
              </div>
              <p className="mt-4 text-[12px] font-medium uppercase tracking-wider text-muted">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-[17px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
