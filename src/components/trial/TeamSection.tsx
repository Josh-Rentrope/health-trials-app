// components/trial/TeamSection.tsx
import React from 'react';
import Image from 'next/image';
import { Section } from '@/components/ui/Section';
import { Trial } from '@/lib/types';

type TeamSectionProps = {
  team: Trial['team'];
};

export const TeamSection: React.FC<TeamSectionProps> = ({ team }) => {
  return (
    <Section title="Meet the Team">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((member) => (
          <div key={member.name} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <Image
              src={member.imageUrl} // Ensure you have a placeholder image in /public
              alt={`Photo of ${member.name}`}
              width={80}
              height={80}
              className="rounded-full mx-auto mb-4"
            />
            <h4 className="font-bold text-gray-900">{member.name}</h4>
            <p className="text-sm text-purple-600">{member.role}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};