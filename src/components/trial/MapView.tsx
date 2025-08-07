// components/trial/MapView.tsx
'use client';

import React, { useState, useRef } from 'react';
import Map, { Marker, ViewState, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { useTrialStore } from '@/stores/trialStore';
import { Trial } from '@/lib/api';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapView: React.FC<{ trials: Trial[] }> = ({ trials }) => {
  const mapRef = useRef<MapRef>(null);
  const { mapViewState, setMapViewState, setFilters } = useTrialStore();

  // 1. Format trial data into GeoJSON points for clustering
  const points = trials.flatMap(trial =>
    trial.locations?.map(loc => ({
      type: 'Feature',
      properties: { cluster: false, trialId: trial.nct_number },
      geometry: { type: 'Point', coordinates: [loc.longitude, loc.latitude] },
    })) ?? []
  );

  const bounds = mapRef.current ? mapRef.current.getMap().getBounds().toArray().flat() as [number, number, number, number] : undefined;

  // 2. Set up the supercluster hook
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: mapViewState.zoom ?? 4,
    options: { radius: 75, maxZoom: 20 },
  });

  // 3. Update global filters when the map stops moving
  const handleMoveEnd = (event:any) => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      setFilters({
        bounds: {
          sw: bounds.getSouthWest().toArray() as [number, number],
          ne: bounds.getNorthEast().toArray() as [number, number],
        },
      });
    }
    //setMapViewState(event.viewState)

  };

  return (
    <Map
      ref={mapRef}
      {...mapViewState}
      onMove={evt => setMapViewState(evt.viewState)}
      onMoveEnd={handleMoveEnd} // Fire event to update filters
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '75vh' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      {/* 4. Map over CLUSTERS instead of raw trials */}
      {clusters.map(cluster => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;

        if (isCluster) {
          return (
            <Marker key={`cluster-${cluster.id}`} latitude={latitude} longitude={longitude}>
              <div
                className="flex items-center justify-center bg-purple-600 text-white rounded-full cursor-pointer"
                style={{ width: `${30 + (pointCount / points.length) * 40}px`, height: `${30 + (pointCount / points.length) * 40}px` }}
                onClick={() => {
                  const expansionZoom = Math.min(supercluster!.getClusterExpansionZoom(cluster.id), 20);
                  setViewState({ ...viewState, latitude, longitude, zoom: expansionZoom });
                }}
              >
                {pointCount}
              </div>
            </Marker>
          );
        }

        return (
          <Marker key={`trial-${cluster.properties.trialId}`} latitude={latitude} longitude={longitude}>
            <div style={{ color: 'red', fontSize: '24px' }}>📍</div>
          </Marker>
        );
      })}
    </Map>
  );
};

export default MapView;