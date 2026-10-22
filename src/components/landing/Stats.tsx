// The numbers this product actually has, read from GET /stats on 2026-10-22.
// The previous set ("40,000+ patients monthly", "20,000+ verified trials", "1,200+
// research partners") was invented marketing copy on a page whose real dataset is
// far larger and — unlike the invented figures — checkable. Real numbers are both
// better and defensible.
//
// They are a snapshot: ClinicalTrials.gov changes daily, and the precise count
// belongs in one place rather than being re-derived in prose.
export const Stats = () => {
  const stats = [
    { value: '607,160', label: 'Clinical trials indexed' },
    { value: '447,761', label: 'Study sites mapped' },
    { value: '3,235', label: 'US counties linked to health data' },
    { value: '100%', label: 'Sourced from the live registry' },
  ];

  return (
    <section className="border-b border-line bg-surface py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-6">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-y-1">
              <dd className="tnum order-first text-[32px] font-semibold tracking-tight text-ink">
                {stat.value}
              </dd>
              <dt className="text-[13px] leading-5 text-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
