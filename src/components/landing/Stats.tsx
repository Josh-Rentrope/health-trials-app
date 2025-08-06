export const Stats = () => {
  const stats = [
    { value: '40,000+', label: 'Patients Supported Monthly' },
    { value: '20,000+', label: 'Verified Trials' },
    { value: '1,200+', label: 'Research Partners' },
    { value: '100%', label: 'Patient Data Privacy' },
  ];

  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-10 text-center lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dt className="text-base leading-7 text-gray-600">{stat.label}</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};