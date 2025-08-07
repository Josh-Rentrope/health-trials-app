// components/trial/MapView.tsx
'use client';

import React, { useState } from 'react';

import Map, { Marker, ViewState } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Trial } from '@/lib/api'; // Import your Trial type

// Define the props the component will accept
type MapViewProps = {
  trials: Trial[];
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapView: React.FC<MapViewProps> = ({ trials }) => {
  // Manage the map's position and zoom level with local state
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5,
  });

  if (!MAPBOX_TOKEN) {
    return <div className="flex items-center justify-center h-full bg-gray-200"><p className="text-red-600">Error: Mapbox token not configured.</p></div>;
  }

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '75vh', borderRadius: '0.5rem' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      //mapStyle="https://demotiles.maplibre.org/style.json"
    >
      {/* Map over the trials passed in as props to render markers */}
      {trials.map(trial =>
        trial.locations?.map(loc => (
          <Marker
            key={`${trial.nct_number}_${loc.latitude}`}
            longitude={loc.longitude}
            latitude={loc.latitude}
            anchor="bottom"
          >
            {/* You can customize the marker icon here */}
            <div style={{ color: 'red', fontSize: '24px' }}>📍</div>
          </Marker>
        ))
      )}
    </Map>
  );
};

export default MapView;