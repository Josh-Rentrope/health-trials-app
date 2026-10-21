import { Search, FileText, Link2 } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      icon: <Search className="h-10 w-10 text-blue-600" />,
      title: '1. Discover Your Options',
      description: 'Use our powerful, live search to find trials by condition, location, and more. We pull directly from official sources so you never miss an opportunity.',
    },
    {
      icon: <FileText className="h-10 w-10 text-blue-600" />,
      title: '2. Evaluate with Clarity',
      description: 'We translate complex medical jargon into plain language. Understand the purpose, requirements, and potential of each trial before you apply.',
    },
    {
      icon: <Link2 className="h-10 w-10 text-blue-600" />,
      title: '3. Connect with Confidence',
      description: 'Easily connect with research teams directly through the platform. Your information is kept private until you decide to share it.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Your Journey, Simplified</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How It Works
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Finding the right clinical trial shouldn&apos;t be another burden. We&apos;ve streamlined the process into three simple steps.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-2xl font-semibold leading-7 text-gray-900">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white shadow-md">
                    {step.icon}
                  </div>
                  {step.title}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{step.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};