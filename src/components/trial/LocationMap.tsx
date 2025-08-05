// components/trial/LocationMap.tsx
'use client';

import { Location } from '@/lib/types';
import React from 'react';

type LocationMapProps = {
  locations: Location[];
};

export const LocationMap: React.FC<LocationMapProps> = ({ locations }) => {
  // In a real application, you would integrate an interactive map library here.
  // For example, using react-leaflet or Google Maps API.
  // The location data (lat, lng) is passed from the server.
  
  const centerLat = locations[0]?.coords.lat ?? 36.10;
  const centerLng = locations[0]?.coords.lng ?? -80.27;

  return (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <p className="font-semibold">Interactive Map Placeholder</p>
        <p className="text-sm">Centering on: {centerLat}, {centerLng}</p>
      </div>
    </div>
  );
};