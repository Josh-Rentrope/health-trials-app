
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-center text-[13px] leading-6 text-muted">
          &copy; {currentYear} Clinical Trials. Study data comes from{' '}
          <a
            href="https://clinicaltrials.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            ClinicalTrials.gov
          </a>
          , a service of the U.S. National Library of Medicine. This site is not
          affiliated with or endorsed by NLM.
        </p>
        <p className="mt-2 text-center text-[12px] leading-5 text-muted">
          Information here is for finding studies, not for medical advice. Talk to
          your care team before making any treatment decision.
        </p>
      </div>
    </footer>
  );
};
