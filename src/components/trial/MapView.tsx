// components/trial/MapView.tsx
'use client';

import React, { useState, useRef } from 'react';
import Map, { Marker, ViewState, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { useTrialStore } from '@/stores/trialStore';
//import { Trial } from '@/lib/api';
import { ApiCluster, fetchMapData, MapData, Trial } from '@/lib/api-client'; 
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapView: React.FC<{ trials: Trial[] }> = ({ trials }) => {
  const mapRef = useRef<MapRef>(null);
  const { mapViewState, setMapViewState, filters, setFilters } = useTrialStore();

  // TODO: Check if this is needed after server clustering
  // 1. Format trial data into GeoJSON points for clustering
  const points = trials.flatMap(trial => {
    // Ensure locations exist before trying to map them
    if (!trial.locations) return [];

    return trial.locations.flatMap((loc, index) => {
      // 1. Filter out invalid locations (null, 0,0 coordinates, etc.)
      if (!loc || !loc.latitude || !loc.longitude) {
        return []; // Return an empty array to skip this location
      }

      // 2. If the location is valid, create the GeoJSON point
      return [{
        type: 'Feature',
        properties: {
          cluster: false,
          trialId: trial.id,
          // 3. Create a unique composite key for this specific location
          locationKey: `${trial.id}-${index}`,
          // 4. Add extra data for the upcoming popup feature
          trialTitle: trial.title,
          trialStatus: trial.status,
        },
        geometry: { type: 'Point', coordinates: [loc.longitude, loc.latitude] },
      }];
    });
  });
  

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
    if (mapRef.current && mapRef.current.getMap().isStyleLoaded()) {
      const mapBounds = mapRef.current.getBounds();
      setFilters({
        bounds: {
          sw: { lng: mapBounds.getSouthWest().lng, lat: mapBounds.getSouthWest().lat },
          ne: { lng: mapBounds.getNorthEast().lng, lat: mapBounds.getNorthEast().lat },
        },
      });
    }
    //setMapViewState(event.viewState)

  };


  const [debouncedFilters] = useDebounce(filters, 500); // Debounce filter changes

  const { data: mapData = [] } = useQuery<MapData>({
    queryKey: ['mapData', debouncedFilters, Math.round(mapViewState.zoom ?? 4)],
    queryFn: () => fetchMapData(debouncedFilters, mapViewState.zoom ?? 4),
    keepPreviousData: true,
  });
  // --- END: New Data Fetching Logic ---

  const handleMapChange = () => { // Single handler for load, move, and zoom
    if (mapRef.current && mapRef.current.getMap().isStyleLoaded()) {
      const mapBounds = mapRef.current.getBounds();
      setFilters({ // This will trigger the debounced refetch
        bounds: {
          sw: { lng: mapBounds.getSouthWest().lng, lat: mapBounds.getSouthWest().lat },
          ne: { lng: mapBounds.getNorthEast().lng, lat: mapBounds.getNorthEast().lat },
        },
      });
    }
  };

  return (
    <Map
      ref={mapRef}
      {...mapViewState}

      onLoad={handleMapChange}
      onMove={evt => setMapViewState(evt.viewState)}
      onMoveEnd={handleMapChange} // Update bounds when movement stops
      onZoomEnd={handleMapChange} // Update on zoom as well

      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '75vh' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      {mapData.map((item : ApiCluster | Trial)=> {
        if (item.is_cluster) {
          const cluster = item as ApiCluster;
          return (
            <Marker key={`cluster-${cluster.latitude}-${cluster.longitude}`} latitude={cluster.latitude} longitude={cluster.longitude}>
              <div
                className="flex items-center justify-center bg-purple-600 text-white rounded-full cursor-pointer"
                style={{ width: `${30 + (cluster.point_count / 1000) * 40}px`, height: `${30 + (cluster.point_count / 1000) * 40}px` }}
                onClick={() => {
                  setMapViewState({ ...mapViewState, latitude: cluster.latitude, longitude: cluster.longitude, zoom: (mapViewState.zoom ?? 4) + 2 });
                }}
              >
                {cluster.point_count}
              </div>
            </Marker>
          );
        } else {
            const trial = item as Trial;
            // A trial might have multiple locations, render a marker for each
            return trial.locations?.map((loc, index) => (
                 <Marker key={`${trial.id}-${index}`} latitude={loc.latitude} longitude={loc.longitude}>
                    <div style={{ color: 'red', fontSize: '24px' }}>📍</div>
                 </Marker>
            ))
        }
      })}
    </Map>
  );
};

export default MapView;