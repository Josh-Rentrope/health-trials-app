import { ShieldCheck, DatabaseZap, Scale } from 'lucide-react';

export const TrustAndSafety = () => {
  const features = [
    {
      name: 'Your Data Stays Yours',
      description: 'We believe in patient privacy. Your personal information is never shared without your explicit consent. You control your data.',
      icon: <ShieldCheck className="h-8 w-8 text-white" />,
    },
    {
      name: 'Verified, Up-to-Date Trials',
      description: 'Our platform connects directly to official government databases, ensuring all trial information is current, accurate, and from verified research institutions.',
      icon: <DatabaseZap className="h-8 w-8 text-white" />,
    },
    {
      name: 'Unbiased, Patient-First Results',
      description: 'Our search results are comprehensive and unbiased. We are not paid to promote specific trials. Our only goal is to help you find the best option for you.',
      icon: <Scale className="h-8 w-8 text-white" />,
    },
  ];

  return (
    <div className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Our Commitment to You</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            A Platform Built on Trust
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-1 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-xl font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                    {feature.icon}
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};