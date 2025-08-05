// components/trials/TrialsMapView.tsx
'use client';

import { Location } from '@/lib/types';
import React from 'react';

type TrialsMapViewProps = {
  locations: Location[];
};

export const TrialsMapView: React.FC<TrialsMapViewProps> = ({ locations }) => {
  // This would be replaced with a real map implementation
  // using a library like react-leaflet or @vis.gl/react-google-maps
  return (
    <div className="w-full h-[60vh] bg-gray-200 rounded-lg flex items-center justify-center border">
      <div className="text-center text-gray-500">
        <p className="text-xl font-semibold">Interactive Map Placeholder</p>
        <p>{locations.length} trial locations would be plotted here.</p>
      </div>
    </div>
  );
};