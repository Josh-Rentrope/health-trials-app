// components/trial/MapView.tsx
'use client';

import React, { useRef } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { useTrialStore } from '@/stores/trialStore';
import { ApiCluster, fetchMapData, fetchTrialsFromApi, Trial } from '@/lib/api-client';
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const CLUSTER_THRESHOLD = 12; // Same threshold as the backend

type GeoJSONPoint = GeoJSON.Feature<GeoJSON.Point, {
  cluster: false;
  trialId: string;
  locationKey: string;
  trialTitle: string;
}>;


const MapView: React.FC<{}> = () => {
  const mapRef = useRef<MapRef>(null);
  const { mapViewState, setMapViewState, filters, setFilters } = useTrialStore();
  const [debouncedViewState] = useDebounce(mapViewState, 200);
  const [debouncedFilters] = useDebounce(filters, 500); // 500ms delay

  const bounds = mapRef.current ? mapRef.current.getMap().getBounds().toArray().flat() as [number, number, number, number] : undefined;

  const { data: mapData } = useQuery({
    // The query key now uses the debounced filters
    queryKey: ['mapData', debouncedFilters, Math.round(mapViewState.zoom ?? 0)],
    queryFn: async () => {
      // Ensure we use the debounced bounds for the API call
      if (!debouncedFilters.bounds) return [];

      const currentZoom = Math.round(mapViewState.zoom ?? 0);

      if (currentZoom < CLUSTER_THRESHOLD) {
        // Zoomed out: Fetch pre-clustered data from the server
        return fetchMapData(debouncedFilters, currentZoom);
      } else {
        // Zoomed in: Fetch individual trials for client-side clustering
        const { trials } = await fetchTrialsFromApi({ ...debouncedFilters, limit: 1000, page: 0 });
        return trials;
      }
    },
    // The query is enabled only when we have (debounced) bounds
    enabled: !!debouncedFilters.bounds,
    keepPreviousData: true,
  });

  // --- Client-side clustering setup (only used when zoomed in) ---
  const points: GeoJSONPoint[] = (mapData && (mapViewState.zoom ?? 0) >= CLUSTER_THRESHOLD)
    ? (mapData as Trial[]).flatMap(trial =>
        (trial.locations || []).map((loc, index) => ({
          type: 'Feature',
          properties: {
            cluster: false,
            trialId: trial.id,
            locationKey: `${trial.id}-${index}`,
            trialTitle: trial.title,
          },
          geometry: { type: 'Point', coordinates: [loc.longitude, loc.latitude] },
        }))
      )
    : [];

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: filters.bounds ? [filters.bounds.sw.lng, filters.bounds.sw.lat, filters.bounds.ne.lng, filters.bounds.ne.lat] : undefined,
    zoom: mapViewState.zoom,
    options: { radius: 75, maxZoom: 20 },
  });
  // --- Handlers ---
  // This handler now updates the "live" filters rapidly.
  // The API call will wait for the debounced version.
  const handleMapInteraction = () => {
    if (mapRef.current) {
      const newBounds = mapRef.current.getMap().getBounds();
      setFilters({
        bounds: {
          sw: { lng: newBounds.getSouthWest().lng, lat: newBounds.getSouthWest().lat },
          ne: { lng: newBounds.getNorthEast().lng, lat: newBounds.getNorthEast().lat },
        }
      });
    }
  };

  return (
    <Map
      ref={mapRef}
      {...mapViewState}
      onMove={evt => setMapViewState(evt.viewState)}
      onMoveEnd={handleMapInteraction}
      onZoomEnd={handleMapInteraction}
      onLoad={handleMapInteraction}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      {/* --- RENDER LOGIC --- */}
      { (mapViewState.zoom ?? 0) < CLUSTER_THRESHOLD ? (
        // A) Zoomed Out: Render server-provided clusters/points
        mapData?.map((item: ApiCluster | Trial) => {
          if (item.is_cluster) {
            const maxCircleSize = 80; // Max diameter in pixels
            const circleSize = Math.min(maxCircleSize, 30 + (item.point_count / 100) * 20);

            return (
              <Marker key={`server-cluster-${item.latitude}-${item.longitude}`} latitude={item.latitude} longitude={item.longitude}>
                <div
                  className="flex items-center justify-center bg-blue-600 text-white rounded-full cursor-pointer"
                  style={{ width: `${circleSize}px`, height: `${circleSize}px` }}
                  onClick={() => setMapViewState({ ...mapViewState, latitude: item.latitude, longitude: item.longitude, zoom: (mapViewState.zoom ?? 0) + 2 })}
                >
                  {item.point_count}
                </div>
              </Marker>
            );
          }
          // Render individual trials if server sends them at low zoom
          return (item as Trial).locations?.map((loc, index) => (
            <Marker key={`${(item as Trial).id}-${index}`} latitude={loc.latitude} longitude={loc.longitude}>
              <div style={{ color: 'orange', fontSize: '24px' }}>📍</div>
            </Marker>
          ));
        })
      ) : (
        // B) Zoomed In: Render client-side clusters/points from useSupercluster
        clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isClientCluster, point_count: pointCount } = cluster.properties;

          if (isClientCluster) {
            return (
              <Marker key={`client-cluster-${cluster.id}`} latitude={latitude} longitude={longitude}>
                <div
                  className="flex items-center justify-center bg-purple-600 text-white rounded-full cursor-pointer"
                  style={{ width: `${30 + (pointCount / points.length) * 40}px`, height: `${30 + (pointCount / points.length) * 40}px` }}
                  onClick={() => {
                    const expansionZoom = Math.min(supercluster!.getClusterExpansionZoom(cluster.id as number), 20);
                    setMapViewState({ ...mapViewState, latitude, longitude, zoom: expansionZoom });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }
          return (
            <Marker key={`trial-${cluster.properties.locationKey}`} latitude={latitude} longitude={longitude}>
              <div style={{ color: 'red', fontSize: '24px' }}>📍</div>
            </Marker>
          );
        })
      )}
    </Map>
  );
};

export default MapView;