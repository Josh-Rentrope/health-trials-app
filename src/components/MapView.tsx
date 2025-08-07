import React from 'react';
import Map, { Marker, ViewStateChangeEvent } from 'react-map-gl';
import { useTrialStore } from '../stores/trialStore';
import 'mapbox-gl/dist/mapbox-gl.css';

// ⚠️ Replace with your actual Mapbox access token
const MAPBOX_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN'; 

const MapView: React.FC = () => {
  // Types for all these properties are inferred from the typed Zustand store
  const {
    mapViewState,
    setMapViewState,
    trials,
    hoveredTrialId,
    setHoveredTrialId,
    selectedTrialId,
    setSelectedTrialId,
  } = useTrialStore();

  // The event type is provided by react-map-gl for strong typing
  const handleMove = (evt: ViewStateChangeEvent) => {
    setMapViewState(evt.viewState);
  };

  return (
    <Map
      {...mapViewState}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      onMove={handleMove} // Update store on user interaction 
    >
      {/* Map over the trials array from the store to render markers  */}
      {trials.map((trial) =>
        trial.locations?.map((loc) => (
          <Marker
            key={`${trial.nct_number}_${loc.latitude}`}
            longitude={loc.longitude}
            latitude={loc.latitude}
            anchor="bottom"
          >
            <div
              className="map-marker"
              // Update state on hover and click events 
              onMouseEnter={() => setHoveredTrialId(trial.nct_number)}
              onMouseLeave={() => setHoveredTrialId(null)}
              onClick={() => setSelectedTrialId(trial.nct_number)}
              // Conditionally style based on interaction state 
              style={{
                cursor: 'pointer',
                color:
                  trial.nct_number === hoveredTrialId
                    ? 'blue'
                    : trial.nct_number === selectedTrialId
                    ? 'green'
                    : 'red',
                fontSize:
                  trial.nct_number === selectedTrialId ? '24px' : '18px',
              }}
            >
              📍
            </div>
          </Marker>
        ))
      )}
    </Map>
  );
};

export default MapView;