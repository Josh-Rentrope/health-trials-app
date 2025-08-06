import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl text-gray-900">
            Find Promising New Treatments.
            <strong className="block font-extrabold text-blue-600 mt-2">
              Take Control of Your Health.
            </strong>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            Discover clinical trials for your condition. We simplify the search,
            provide clear information, and connect you with research teams—all
            in one place.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/trials"
              className="group flex items-center justify-center w-full rounded-md bg-blue-600 px-12 py-4 text-lg font-bold text-white shadow-lg transition-transform transform-gpu hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring active:bg-blue-500 sm:w-auto"
            >
              Search Trials
              <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};