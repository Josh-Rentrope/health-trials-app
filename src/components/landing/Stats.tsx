// The numbers this product actually has. The previous set ("40,000+ patients
// monthly", "20,000+ verified trials", "1,200+ research partners") was invented
// marketing copy on a page whose real dataset is far larger and — unlike the
// invented figures — checkable. Real numbers are both better and defensible.
export const Stats = () => {
  const stats = [
    { value: '607,992', label: 'Clinical trials indexed' },
    { value: '447,761', label: 'Study sites mapped' },
    { value: '3,235', label: 'US counties linked to health data' },
    { value: '100%', label: 'Sourced from the live registry' },
  ];

  return (
    <div className="border-y border-line bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 text-center lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dd className="tnum order-first text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {stat.value}
              </dd>
              <dt className="text-[13px] leading-6 text-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};
