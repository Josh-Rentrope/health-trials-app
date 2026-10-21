// components/trial/MapView.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
// Imported as MapGL, not Map: the default export shadows the global `Map`
// constructor, so `new Map<string, number>()` anywhere in this file resolves to
// the React component and fails to type-check.
import MapGL, { Marker, MapRef, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSupercluster from 'use-supercluster';
import { useTrialStore } from '@/stores/trialStore';
import {
  ApiCluster,
  CountyCorrelation,
  GeoJSONFeatureCollection,
  MapData,
  Trial,
  fetchCorrelationData,
  fetchCountyBoundariesFromApi,
  fetchMapData,
  fetchTrialsFromApi,
} from '@/lib/api-client';
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const CLUSTER_THRESHOLD = 12;

// `type: 'Feature'` has to be a literal, not a widened `string`, or the object is
// not assignable to the GeoJSON feature types supercluster expects.
type PointProperties = {
  cluster: false;
  trialId: string;
  locationKey: string;
  trialTitle: string;
  precision?: string | null;
};

type PointFeature = GeoJSON.Feature<GeoJSON.Point, PointProperties>;

// What a supercluster cluster carries. `use-supercluster` types the properties
// loosely, so this is asserted at the one place a cluster is destructured.
type ClusterProperties = {
  cluster?: boolean;
  point_count?: number;
  locationKey?: string;
};

type MapViewProps = {
  onMapMove?: () => void;
};

const MapView: React.FC<MapViewProps> = ({ onMapMove }) => {
  const mapRef = useRef<MapRef>(null);
  const { mapViewState, setMapViewState, filters, setFilters, viewMode } = useTrialStore();
  const [debouncedFilters] = useDebounce(filters, 500);
  const [activePopup, setActivePopup] = useState<
    | { type: 'trial'; data: Trial; longitude: number; latitude: number }
    | { type: 'county'; data: CountyCorrelation; longitude: number; latitude: number }
    | null
  >(null);

  const isCorrelationMode = viewMode === 'correlation';
  const correlationQueryEnabled =
    isCorrelationMode && !!filters.correlationCondition && !!filters.demographicVariable;

  const currentZoom = Math.round(mapViewState.zoom ?? 0);

  const { data: mapData } = useQuery<MapData>({
    queryKey: ['mapData', debouncedFilters, currentZoom],
    queryFn: async () => {
      if (!debouncedFilters.bounds) return [];
      if (currentZoom < CLUSTER_THRESHOLD) {
        return fetchMapData(debouncedFilters, currentZoom);
      }
      // Past the cluster threshold the server returns individual studies rather
      // than clusters, fetched through the list endpoint.
      const { trials } = await fetchTrialsFromApi({ ...debouncedFilters, limit: 200, page: 0 });
      return trials;
    },
    enabled: !!debouncedFilters.bounds,
    // v5 renamed this; the old key was a type error and a silent no-op, so every
    // pan blanked the map until the new data arrived.
    placeholderData: (previous) => previous,
  });

  const { data: correlationData } = useQuery<CountyCorrelation[]>({
    queryKey: ['correlationData', filters.correlationCondition, filters.demographicVariable],
    queryFn: () =>
      fetchCorrelationData(filters.correlationCondition || '', filters.demographicVariable || ''),
    enabled: correlationQueryEnabled,
  });

  const { data: countyBoundaries } = useQuery<GeoJSONFeatureCollection>({
    queryKey: ['countyBoundaries'],
    queryFn: fetchCountyBoundariesFromApi,
    enabled: isCorrelationMode,
    staleTime: Infinity,
  });

  const points = useMemo<PointFeature[]>(() => {
    if (!mapData) return [];
    return mapData
      .filter((item): item is Trial => !item.is_cluster)
      .flatMap((trial) =>
        (trial.locations ?? []).map((loc, index) => ({
          type: 'Feature' as const,
          properties: {
            cluster: false as const,
            trialId: trial.id,
            locationKey: `${trial.id}-${index}`,
            trialTitle: trial.title,
            precision: loc.precision ?? null,
          },
          geometry: { type: 'Point' as const, coordinates: [loc.longitude, loc.latitude] },
        })),
      );
  }, [mapData]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: filters.bounds
      ? [filters.bounds.sw.lng, filters.bounds.sw.lat, filters.bounds.ne.lng, filters.bounds.ne.lat]
      : undefined,
    zoom: mapViewState.zoom ?? 3,
    options: { radius: 75, maxZoom: 20 },
  });

  const handleMapInteraction = () => {
    onMapMove?.();
    const map = mapRef.current?.getMap();
    if (!map) return;
    const newBounds = map.getBounds();
    if (!newBounds) return;
    setFilters({
      bounds: {
        sw: { lng: newBounds.getSouthWest().lng, lat: newBounds.getSouthWest().lat },
        ne: { lng: newBounds.getNorthEast().lng, lat: newBounds.getNorthEast().lat },
      },
    });
  };

  // County choropleth. `isCorrelationMode` is the real dependency here; the
  // original used the expression `viewMode == "correlation"` as a dependency,
  // which happens to evaluate to the same boolean but reads as an accident.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const sourceId = 'county-boundaries';
    const layerId = 'county-choropleth';

    const manageLayers = () => {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;

      if (isCorrelationMode && countyBoundaries) {
        if (!source) {
          map.addSource(sourceId, { type: 'geojson', data: countyBoundaries as never });
        } else {
          source.setData(countyBoundaries as never);
        }
        if (!map.getLayer(layerId)) {
          map.addLayer(
            {
              id: layerId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': '#CCCCCC',
                'fill-opacity': 0.3,
                'fill-outline-color': '#666666',
              },
            },
            'road-label',
          );
        }
      } else {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (source) map.removeSource(sourceId);
      }
    };

    if (map.isStyleLoaded()) manageLayers();
    else map.once('load', manageLayers);

  }, [isCorrelationMode, countyBoundaries]);

  // Colour the choropleth from the correlation result.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !isCorrelationMode || !correlationData || !countyBoundaries) return;
    const layerId = 'county-choropleth';
    if (!map.getLayer(layerId)) return;

    const present = correlationData
      .map((c) => c.demographic_value)
      .filter((v): v is number => typeof v === 'number');
    if (present.length === 0) return;
    const sorted = [...present].sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

    // Quantile breaks, not fixed thresholds. The original compared against
    // value > 80 / 60 / 40 / 20, which is meaningless for a measure expressed as
    // a percentage (0-1 under the current CHR release) -- every county fell in
    // the lowest bucket, so the map rendered one flat colour. Quantiles adapt to
    // whatever scale the selected measure is actually on.
    const cases: unknown[] = ['case'];
    for (const c of correlationData) {
      const v = c.demographic_value ?? 0;
      let color = '#f2f0f7';
      if (v >= q(0.8)) color = '#54278f';
      else if (v >= q(0.6)) color = '#756bb1';
      else if (v >= q(0.4)) color = '#9e9ac8';
      else if (v >= q(0.2)) color = '#cbc9e2';
      cases.push(['==', ['get', 'GEOID'], c.fips_code], color);
    }
    cases.push('#CCCCCC');

    map.setPaintProperty(layerId, 'fill-color', cases as never);
    map.setPaintProperty(layerId, 'fill-opacity', 0.7);

  }, [isCorrelationMode, correlationData, countyBoundaries]);

  const handleMapClick = (e: mapboxgl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (isCorrelationMode && feature && feature.layer?.id === 'county-choropleth') {
      const fips = (feature.properties as { GEOID?: string } | null)?.GEOID;
      const countyData = correlationData?.find((c) => c.fips_code === fips);
      if (countyData) {
        setActivePopup({
          type: 'county',
          data: countyData,
          longitude: e.lngLat.lng,
          latitude: e.lngLat.lat,
        });
      }
    }
  };

  const renderPopup = () => {
    if (!activePopup) return null;
    const { longitude, latitude } = activePopup;

    if (activePopup.type === 'county') {
      const county = activePopup.data;
      return (
        <Popup
          longitude={longitude}
          latitude={latitude}
          closeOnClick={false}
          onClose={() => setActivePopup(null)}
          anchor="bottom"
        >
          <div className="p-2 bg-white rounded-lg shadow-lg max-w-xs w-64">
            <h4 className="font-bold text-base text-gray-800">{county.county_name}</h4>
            <p className="text-sm text-gray-600">
              Value:{' '}
              <span className="font-medium">
                {county.demographic_value?.toLocaleString() ?? 'N/A'}
              </span>
            </p>
            <hr className="my-2" />
            <h5 className="font-semibold mb-1 text-gray-700">Completed Trials:</h5>
            {county.completed_trials.length > 0 ? (
              <ul className="list-disc list-inside text-xs space-y-1 max-h-32 overflow-y-auto">
                {county.completed_trials.map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
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
    <MapGL
      ref={mapRef}
      {...mapViewState}
      onMove={(evt) => setMapViewState(evt.viewState)}
      onMoveEnd={handleMapInteraction}
      onZoomEnd={handleMapInteraction}
      onLoad={handleMapInteraction}
      onClick={handleMapClick}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      {currentZoom < CLUSTER_THRESHOLD
        ? mapData?.map((item) => {
            if (item.is_cluster) {
              const cluster = item as ApiCluster;
              const circleSize = Math.min(80, 30 + (cluster.point_count / 100) * 20);
              return (
                <Marker
                  key={`server-cluster-${cluster.latitude}-${cluster.longitude}`}
                  latitude={cluster.latitude}
                  longitude={cluster.longitude}
                >
                  <div
                    className="flex items-center justify-center bg-blue-600 text-white rounded-full cursor-pointer text-xs"
                    style={{ width: `${circleSize}px`, height: `${circleSize}px` }}
                    onClick={() =>
                      setMapViewState({
                        ...mapViewState,
                        latitude: cluster.latitude,
                        longitude: cluster.longitude,
                        zoom: (mapViewState.zoom ?? 0) + 2,
                      })
                    }
                  >
                    {cluster.point_count}
                  </div>
                </Marker>
              );
            }
            const trial = item as Trial;
            return (trial.locations ?? []).map((loc, index) => (
              <Marker key={`${trial.id}-${index}`} latitude={loc.latitude} longitude={loc.longitude}>
                <div
                  style={{ fontSize: '20px', cursor: 'pointer' }}
                  // Low-precision points are dimmed rather than hidden: a country
                  // centroid is a real answer to "somewhere in Chile" but it is
                  // not a location, and the UI should not imply that it is.
                  className={loc.precision === 'country' || loc.precision === 'admin1'
                    ? 'opacity-40'
                    : ''}
                  onClick={() =>
                    setActivePopup({
                      type: 'trial',
                      data: trial,
                      longitude: loc.longitude,
                      latitude: loc.latitude,
                    })
                  }
                >
                  📍
                </div>
              </Marker>
            ));
          })
        : clusters.map((cluster) => {
            const [longitude, latitude] = cluster.geometry.coordinates as [number, number];
            const props = cluster.properties as ClusterProperties;
            const pointCount = props.point_count ?? 0;

            if (props.cluster) {
              return (
                <Marker
                  key={`client-cluster-${cluster.id}`}
                  latitude={latitude}
                  longitude={longitude}
                >
                  <div
                    className="flex items-center justify-center bg-purple-600 text-white rounded-full cursor-pointer text-xs"
                    style={{
                      width: `${30 + (points.length ? (pointCount / points.length) * 40 : 0)}px`,
                      height: `${30 + (points.length ? (pointCount / points.length) * 40 : 0)}px`,
                    }}
                    onClick={() => {
                      const expansionZoom = Math.min(
                        supercluster?.getClusterExpansionZoom(cluster.id as number) ?? 20,
                        20,
                      );
                      setMapViewState({ ...mapViewState, latitude, longitude, zoom: expansionZoom });
                    }}
                  >
                    {pointCount}
                  </div>
                </Marker>
              );
            }
            return (
              <Marker
                key={`trial-${props.locationKey ?? `${latitude}-${longitude}`}`}
                latitude={latitude}
                longitude={longitude}
              >
                <div style={{ fontSize: '20px' }}>📍</div>
              </Marker>
            );
          })}
      {renderPopup()}
    </MapGL>
  );
};

export default MapView;
