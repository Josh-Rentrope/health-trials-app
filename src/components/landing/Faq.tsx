import { FaqItem } from '@/components/landing/FaqItem';

/**
 * The questions that stop people from asking a study team anything at all:
 * cost, travel, placebo, time, and what happens to their answers. Answering them
 * plainly is more useful than a fourth reassurance card.
 */
export const Faq = () => {
  return (
    <section className="border-b border-line bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-accent">
          Common questions
        </h2>
        <p className="mt-2 text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]">
          The things people ask before they call
        </p>

        <div className="mt-8">
          <FaqItem question="Does searching cost anything?">
            No. Searching and screening are free and need no account. The study
            itself may bill your insurance or cover some costs — that is between you
            and the study team, and it is written in the consent form.
          </FaqItem>

          <FaqItem question="Will I have to pay for travel?">
            Sometimes. Some studies reimburse travel or offer a stipend; many do not.
            The listing and the study coordinator are the authoritative source, not
            this site.
          </FaqItem>

          <FaqItem question="Could I get a placebo?">
            Some trials compare a treatment against a placebo. If a study uses one,
            the consent form says so before you enrol, and you can decline. No study
            should hide it from you.
          </FaqItem>

          <FaqItem question="How long does a trial take?">
            It varies from a single visit to several years. The registry lists the
            expected enrolment, and the study team gives you the actual schedule
            before you consent.
          </FaqItem>

          <FaqItem question="What happens to my answers?">
            They stay in your browser. The questionnaire turns them into filters
            against a public registry; nothing is attached to an account, because
            there is no account. See the note on the questionnaire itself.
          </FaqItem>

          <FaqItem question="Does this tell me whether I am eligible?">
            No, and it will not pretend to. It tells you which <em>listed</em>{' '}
            criteria you appear to meet and which the registry leaves unstated.
            Organ function, imaging results, and measurable disease are assessed by
            the study team, not by a web form.
          </FaqItem>

          <FaqItem question="Where does the data come from?">
            ClinicalTrials.gov, the U.S. National Library of Medicine&apos;s
            registry. Every row is a real record; we do not generate studies. This
            site is not affiliated with or endorsed by NLM.
          </FaqItem>
        </div>
      </div>
    </section>
  );
};
