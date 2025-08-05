// components/trial/LocationsSection.tsx
import React from 'react';
import { Section } from '@/components/ui/Section';
import { Trial } from '@/lib/types';
import { MapPin, Building } from 'lucide-react';
import { LocationMap } from './LocationMap'; // This will be our Client Component

type LocationsSectionProps = {
  locations: Trial['locations'];
};

export const LocationsSection: React.FC<LocationsSectionProps> = ({ locations }) => {
  return (
    <Section title="Locations">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* List of Locations */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
          {locations.map((loc) => (
            <div key={loc.id} className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" /> {loc.name}
              </h4>
              <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-gray-500" /> 
                {loc.city}, {loc.state} {loc.zip}
              </p>
              <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                loc.status === 'Recruiting' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {loc.status}
              </span>
            </div>
          ))}
        </div>

        {/* Interactive Map */}
        <div className="rounded-lg overflow-hidden h-96">
            <LocationMap locations={locations} />
        </div>
      </div>
    </Section>
  );
};