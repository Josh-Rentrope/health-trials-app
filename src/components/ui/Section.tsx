// components/ui/Section.tsx
import React from 'react';

type SectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => {
  return (
    <section className={className}>
      <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3 mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
};