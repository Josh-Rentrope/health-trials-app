import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const FinalCTA = () => {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl py-16 px-4 sm:px-6 sm:py-24 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Ready to take the next step?
        </h2>
        <p className="mt-4 text-lg leading-6 text-gray-600">
          Your search for a clinical trial starts now. Find promising new treatments and contribute to the future of medicine.
        </p>
        <Link
          href="/trials"
          className="group mt-8 inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform transform-gpu hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Find a Trial Now
          <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};