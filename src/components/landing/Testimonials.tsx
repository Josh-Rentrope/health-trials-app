export const Testimonials = () => {
  const testimonials = [
    {
      body: 'After months of searching, I finally found a trial that was right for me in less than an hour. The clarity and simplicity made all the difference during a very stressful time.',
      author: {
        name: 'Sarah J.',
        role: 'Patient, Breast Cancer Trial',
      },
    },
    {
      body: 'The platform empowered me. I went from feeling helpless to being an active participant in my own treatment plan. I can\'t thank you enough.',
      author: {
        name: 'Michael R.',
        role: 'Patient, Crohn\'s Disease Study',
      },
    },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-gray-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl lg:max-w-4xl">
        <figure>
          <blockquote className="text-center text-xl font-semibold leading-8 text-gray-900 sm:text-2xl sm:leading-9">
            <p>
              “{testimonials[0].body}”
            </p>
          </blockquote>
          <figcaption className="mt-10">
            <div className="mt-4 flex items-center justify-center space-x-3 text-base">
              <div className="font-semibold text-gray-900">{testimonials[0].author.name}</div>
              <svg viewBox="0 0 2 2" width={3} height={3} aria-hidden="true" className="fill-gray-900">
                <circle cx={1} cy={1} r={1} />
              </svg>
              <div className="text-gray-600">{testimonials[0].author.role}</div>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
};