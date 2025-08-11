// components/trial/MapView.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { useTrialStore } from '@/stores/trialStore';
import { ApiCluster, fetchCorrelationData, fetchCountyBoundariesFromApi, fetchMapData, fetchTrialsFromApi, Trial } from '@/lib/api-client';
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const CLUSTER_THRESHOLD = 12;

type GeoJSONPoint = GeoJSON.Feature<GeoJSON.Point, {
  cluster: false;
  trialId: string;
  locationKey: string;
  trialTitle: string;
}>;

// --- Define component props to accept the callback ---
type MapViewProps = {
  onMapMove?: () => void;
};

const MapView: React.FC<MapViewProps> = ({ onMapMove }) => {
  const mapRef = useRef<MapRef>(null);
  const { mapViewState, setMapViewState, filters, setFilters, viewMode } = useTrialStore();
  const [debouncedViewState] = useDebounce(mapViewState, 200);
  const [debouncedFilters] = useDebounce(filters, 500);
  const [activePopup, setActivePopup] = useState<{ type: 'trial' | 'county', data: any, longitude: number, latitude: number } | null>(null);
  
  const isCorrelationMode = viewMode === 'correlation';
  const correlationQueryEnabled = isCorrelationMode && !!filters.correlationCondition && !!filters.demographicVariable;

  const bounds = mapRef.current ? mapRef.current.getMap().getBounds().toArray().flat() as [number, number, number, number] : undefined;


  const { data: mapData } = useQuery({
    queryKey: ['mapData', debouncedFilters, Math.round(mapViewState.zoom ?? 0)],
    queryFn: async () => {
      if (!debouncedFilters.bounds) return [];
      const currentZoom = Math.round(mapViewState.zoom ?? 0);
      if (currentZoom < CLUSTER_THRESHOLD) {
        return fetchMapData(debouncedFilters, currentZoom);
      } else {
        const { trials } = await fetchTrialsFromApi({ ...debouncedFilters, limit: 1000, page: 0 });
        return trials;
      }
    },
    enabled: !!debouncedFilters.bounds,
    keepPreviousData: true,
  });

  
  // Data fetching for Correlation Mode
  const { data: correlationData } = useQuery({
    queryKey: ['correlationData', filters.correlationCondition, filters.demographicVariable],
    queryFn: () => fetchCorrelationData(filters.correlationCondition || "", filters.demographicVariable || ""),
    enabled: correlationQueryEnabled,
  });

  const { data: countyBoundaries } = useQuery<GeoJSONFeatureCollection>({
    queryKey: ['countyBoundaries'],
    queryFn: fetchCountyBoundariesFromApi,
    enabled: isCorrelationMode, // Fetch boundaries as soon as we enter correlation mode
    staleTime: Infinity, 
  });

  const points: GeoJSONPoint[] = (mapData && (mapViewState.zoom ?? 0) >= CLUSTER_THRESHOLD)
    ? (mapData as Trial[]).flatMap(trial =>
        (trial.locations || []).map((loc, index) => ({
          type: 'Feature',
          properties: { cluster: false, trialId: trial.id, locationKey: `${trial.id}-${index}`, trialTitle: trial.title },
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

  const handleMapInteraction = () => {
    // --- Call the new prop to notify parent of interaction ---
    if (onMapMove) {
      onMapMove();
    }

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


  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const sourceId = 'county-boundaries';
    const layerId = 'county-choropleth';

    const manageLayers = () => {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;

      // If we are in correlation mode and have boundaries, add/update the source
      if (isCorrelationMode && countyBoundaries) {
        if (!source) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: countyBoundaries,
          });
        } else {
          source.setData(countyBoundaries);
        }

        // Add the layer if it doesn't exist
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': '#CCCCCC', // Default grey color
              'fill-opacity': 0.3,
              'fill-outline-color': '#666666'
            }
          }, 'road-label');
        }
      } else {
        // If not in correlation mode, remove the layer and source
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (source) map.removeSource(sourceId);
      }
    };

    if (map.isStyleLoaded()) {
      manageLayers();
    } else {
      map.once('load', manageLayers);
    }

  }, [isCorrelationMode, countyBoundaries]);
  
  // --- FIX: A separate useEffect to dynamically update the color based on correlation data ---
  // useEffect(() => {
  //     const map = mapRef.current?.getMap();
  //     if (!map || !map.isStyleLoaded() || !correlationQueryEnabled || !correlationData) return;

  //     const layerId = 'county-choropleth';
  //     if (!map.getLayer(layerId)) return;

  //     // Create a map of FIPS code to demographic value for quick lookup
  //     const dataMap = new Map(correlationData.map(item => [item.fips_code, item.demographic_value]));

  //     // Use a "case" expression to set the color for each feature individually
  //     const colorExpression = ['case'];
  //     countyBoundaries?.features.forEach(feature => {
  //         const fips = feature.properties.GEOID;
  //         const value = dataMap.get(fips) ?? 0;
  //         const color = value > 80 ? '#54278f' : value > 60 ? '#756bb1' : value > 40 ? '#9e9ac8' : value > 20 ? '#cbc9e2' : '#f2f0f7';
  //         colorExpression.push(['==', ['get', 'GEOID'], fips], color);
  //     });
  //     colorExpression.push('#CCCCCC'); // Fallback color

  //     map.setPaintProperty(layerId, 'fill-color', colorExpression);
  //     map.setPaintProperty(layerId, 'fill-opacity', 0.7);

  // }, [false, correlationData, correlationQueryEnabled, countyBoundaries]);



  const handleMapClick = (e: mapboxgl.MapLayerMouseEvent) => {
    const feature = e.features && e.features[0];
    if (isCorrelationMode && feature && feature.layer.id === 'county-choropleth') {
        const fips = feature.properties.GEOID;
        const countyData = correlationData?.find(c => c.fips_code === fips);
        if (countyData) {
            setActivePopup({ type: 'county', data: countyData, longitude: e.lngLat.lng, latitude: e.lngLat.lat });
        }
    }
  };

  const renderPopup = () => {
      if (!activePopup) return null;
      const { type, data, longitude, latitude } = activePopup;
      
      if (type === 'county') {
          const county = data as CountyCorrelation;
          return (
              <Popup longitude={longitude} latitude={latitude} closeOnClick={false} onClose={() => setActivePopup(null)} anchor="bottom">
                  <div className="p-2 bg-white rounded-lg shadow-lg max-w-xs w-64">
                      <h4 className="font-bold text-base text-gray-800">{county.county_name}</h4>
                      <p className="text-sm text-gray-600">Value: <span className="font-medium">{county.demographic_value?.toLocaleString() ?? 'N/A'}</span></p>
                      <hr className="my-2"/>
                      <h5 className="font-semibold mb-1 text-gray-700">Completed Trials:</h5>
                      {county.completed_trials.length > 0 ? (
                          <ul className="list-disc list-inside text-xs space-y-1 max-h-32 overflow-y-auto">
                              {county.completed_trials.map(t => <li key={t.id}>{t.title}</li>)}
                          </ul>
                      ) : (
                          <p className="text-xs italic text-gray-500">No completed trials found.</p>
                      )}
                  </div>
              </Popup>
          );
      }
      return null;
  };


  return (
    <Map
      ref={mapRef}
      {...mapViewState}
      onMove={evt => setMapViewState(evt.viewState)}
      onMoveEnd={handleMapInteraction}
      onZoomEnd={handleMapInteraction}
      onLoad={handleMapInteraction}
      onClick={handleMapClick}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      {/* RENDER LOGIC (Unchanged) */}
      {(mapViewState.zoom ?? 0) < CLUSTER_THRESHOLD ? (
        mapData?.map((item: ApiCluster | Trial) => {
          if (item.is_cluster) {
            const maxCircleSize = 80;
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
          return (item as Trial).locations?.map((loc, index) => (
            <Marker key={`${(item as Trial).id}-${index}`} latitude={loc.latitude} longitude={loc.longitude}>
              <div style={{ color: 'orange', fontSize: '24px' }}>📍</div>
            </Marker>
          ));
        })
      ) : (
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
