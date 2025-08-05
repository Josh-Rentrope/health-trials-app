// components/trial/EligibilitySection.tsx
import React from 'react';
import { Section } from '@/components/ui/Section';
import { Trial } from '@/lib/types';
import { CheckCircle2, XCircle } from 'lucide-react';

type EligibilitySectionProps = {
  criteria: Trial['eligibility'];
};

const CriteriaList: React.FC<{ items: string[]; type: 'inclusion' | 'exclusion' }> = ({ items, type }) => {
  const isInclusion = type === 'inclusion';
  const Icon = isInclusion ? CheckCircle2 : XCircle;
  const iconColor = isInclusion ? 'text-green-600' : 'text-red-600';

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        {isInclusion ? 'Inclusion Criteria' : 'Exclusion Criteria'}
      </h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <span className="text-gray-600">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


export const EligibilitySection: React.FC<EligibilitySectionProps> = ({ criteria }) => {
  return (
    <Section title="Eligibility">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CriteriaList items={criteria.inclusion} type="inclusion" />
        <CriteriaList items={criteria.exclusion} type="exclusion" />
      </div>
    </Section>
  );
};