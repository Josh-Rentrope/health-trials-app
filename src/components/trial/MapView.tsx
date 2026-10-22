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
  Site,
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
const MAX_CLUSTER_ZOOM = 20;

// Cluster size and colour by count, on a LOG scale. Linear sizing made Houston
// (15,170 studies) produce a marker that swallowed the state, and a single flat
// blue gave no sense of density at a glance. The ramp runs light -> accent so the
// eye reads concentration before it reads any number.
const CLUSTER_RAMP = ['#C3BDF6', '#9A8FEC', '#7566E1', '#5B4BD6'];

function clusterVisual(count: number, max: number) {
  const t = max > 1 ? Math.min(1, Math.log10(count + 1) / Math.log10(max + 1)) : 0.5;
  return {
    size: Math.round(26 + t * 36),
    color: CLUSTER_RAMP[Math.min(CLUSTER_RAMP.length - 1, Math.floor(t * CLUSTER_RAMP.length))],
  };
}

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
  // Present on individual points (the non-cluster branch).
  trialId?: string;
  trialTitle?: string;
  precision?: string | null;
};

type MapViewProps = {
  onMapMove?: () => void;
};

const MapView: React.FC<MapViewProps> = ({ onMapMove }) => {
  const mapRef = useRef<MapRef>(null);
  // Where the pointer went down, so a click can be distinguished from the end of
  // a pan. Mapbox fires `click` after a drag in some cases, and without this a
  // pan that ends over empty map would dismiss the popup the user was reading.
  const downPoint = useRef<{ x: number; y: number } | null>(null);
  // A marker's click can also surface as a map click in some browsers. Without
  // this, the map's dismiss handler closes the popup the marker just opened.
  const suppressMapClick = useRef(false);
  const markMarkerClick = () => {
    suppressMapClick.current = true;
    window.setTimeout(() => {
      suppressMapClick.current = false;
    }, 60);
  };
  const { mapViewState, setMapViewState, filters, setFilters, viewMode,
          focusTrial, setFocusTrial } = useTrialStore();
  const [debouncedFilters] = useDebounce(filters, 500);
  const [activePopup, setActivePopup] = useState<
    | { type: 'trial'; data: Trial; longitude: number; latitude: number }
    | { type: 'county'; data: CountyCorrelation; longitude: number; latitude: number }
    // Several trials at the same coordinates. Supercluster cannot split these at
    // any zoom, so the cluster is the destination rather than a stepping stone.
    | { type: 'multi'; data: Trial[]; total: number; longitude: number; latitude: number }
    | null
  >(null);

  const isCorrelationMode = viewMode === 'correlation';
  const correlationQueryEnabled =
    isCorrelationMode && !!filters.correlationCondition && !!filters.demographicVariable;

  const currentZoom = Math.round(mapViewState.zoom ?? 0);

  // A small card follows the pointer over a marker. Kept separate from
  // `activePopup` so hovering never steals the popup the user opened.
  const [hovered, setHovered] = useState<{
    longitude: number;
    latitude: number;
    title: string;
    meta: string;
  } | null>(null);

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

  // Hold the last map we successfully painted, so a failed request leaves the
  // current view alone instead of blanking the map under the user's cursor.
  const lastGoodMap = useRef<MapData | undefined>(undefined);
  if (mapData) lastGoodMap.current = mapData;
  const shownMap: MapData = mapData ?? lastGoodMap.current ?? [];

  // Trials by id, so a cluster's leaves can be resolved back to their records.
  const trialById = useMemo(() => {
    const m = new Map<string, Trial>();
    for (const item of shownMap) {
      if (!item.is_cluster && !item.is_site) m.set(item.id, item);
    }
    return m;
  }, [shownMap]);

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
    if (!shownMap.length) return [];
    return shownMap
      // Sites are multi-trial points, not points to cluster; they render as their
      // own marker and open a list.
      .filter((item): item is Trial => !item.is_cluster && !item.is_site)
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
  }, [shownMap]);

  // How much the current viewport holds, and the busiest single cluster -- the
  // denominator for the log size ramp.
  const { viewportTotal, maxCluster } = useMemo(() => {
    let total = 0;
    let max = 1;
    for (const item of shownMap) {
      if (item.is_cluster || item.is_site) {
        total += item.point_count;
        if (item.point_count > max) max = item.point_count;
      } else {
        total += 1;
      }
    }
    return { viewportTotal: total, maxCluster: max };
  }, [shownMap]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: filters.bounds
      ? [filters.bounds.sw.lng, filters.bounds.sw.lat, filters.bounds.ne.lng, filters.bounds.ne.lat]
      : undefined,
    zoom: mapViewState.zoom ?? 3,
    options: { radius: 75, maxZoom: 20 },
  });

  // A card was double-clicked: fly to it and open its popup.
  //
  // The page has already switched to the map view and set the view state, so the
  // controlled <MapGL> would move anyway; `flyTo` is what makes it read as an
  // intentional move rather than a jump. It is guarded because the map may not
  // have finished loading on the very first render after the switch.
  useEffect(() => {
    if (!focusTrial) return;
    const loc = focusTrial.locations?.[0];
    if (!loc) {
      setFocusTrial(null);
      return;
    }
    const map = mapRef.current?.getMap();
    if (map?.isStyleLoaded()) {
      map.flyTo({ center: [loc.longitude, loc.latitude], zoom: 12, duration: 900 });
    }
    setActivePopup({
      type: 'trial',
      data: focusTrial,
      longitude: loc.longitude,
      latitude: loc.latitude,
    });
    // Cleared so the same card can be focused again, and so a re-render does not
    // re-open a popup the user has closed.
    setFocusTrial(null);
  }, [focusTrial, setFocusTrial]);

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

  // Whether clicking this cluster will actually reveal more structure. Used by
  // both the hover wording and the click, so the two cannot disagree.
  const clusterCanExpand = (id: number) => {
    const raw = supercluster?.getClusterExpansionZoom(id) ?? MAX_CLUSTER_ZOOM;
    const zoomNow = mapViewState.zoom ?? 0;
    const target = Math.min(raw, MAX_CLUSTER_ZOOM);
    return !(raw >= MAX_CLUSTER_ZOOM || target <= zoomNow || zoomNow >= MAX_CLUSTER_ZOOM - 1);
  };

  const handleMapClick = (e: mapboxgl.MapLayerMouseEvent) => {
    // The click that opened a marker popup must not immediately dismiss it.
    if (suppressMapClick.current) return;
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
        return;
      }
    }
    // Anything else is a click on the map itself. Dismiss whatever is open --
    // that is the expected way to get rid of a popup, and Mapbox's own
    // `closeOnClick` cannot be used because it also fires when a marker is
    // clicked, closing the popup the marker just opened.
    if (activePopup) setActivePopup(null);
  };

  const renderPopup = () => {
    if (!activePopup) return null;
    const { longitude, latitude } = activePopup;

    // Several trials at one coordinate. Scrollable, because a large site can
    // legitimately host a dozen studies and a popup that grows off-screen is
    // worse than one that scrolls.
    if (activePopup.type === 'multi') {
      const { data: trials, total } = activePopup;
      return (
        <Popup
          longitude={longitude}
          latitude={latitude}
          closeOnClick={false}
          onClose={() => setActivePopup(null)}
          anchor="bottom"
          maxWidth="360px"
        >
          <div className="p-1">
            <h4 className="font-semibold text-sm text-gray-900">
              {total} trial{total === 1 ? '' : 's'} here
            </h4>
            <p className="text-[11px] text-gray-500 mb-1">
              Showing {trials.length}
              {total > trials.length ? ` of ${total}` : ''}
            </p>
            <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {trials.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePopup({ type: 'trial', data: t, longitude, latitude })
                    }
                    className="w-full text-left py-2 px-1 hover:bg-gray-50 rounded"
                  >
                    <p className="text-xs font-medium text-gray-900 leading-snug line-clamp-2">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {t.status}
                      {t.phases.length > 0 ? ` · ${t.phases.join(', ')}` : ''}
                    </p>
                    <p className="text-[11px] text-accent font-mono">{t.id}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Popup>
      );
    }

    // The trial popup. The click handlers below always set this state; only the
    // county branch was ever rendered, so clicking a pin set state and then
    // displayed nothing.
    if (activePopup.type === 'trial') {
      const trial = activePopup.data;
      return (
        <Popup
          longitude={longitude}
          latitude={latitude}
          closeOnClick={false}
          onClose={() => setActivePopup(null)}
          anchor="bottom"
          maxWidth="320px"
        >
          <div className="p-1 max-w-xs">
            <h4 className="font-semibold text-sm text-gray-900 leading-snug">
              {trial.title}
            </h4>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              {trial.acronym && <p className="font-mono">{trial.acronym}</p>}
              <p>
                <span className="font-medium text-gray-700">{trial.status}</span>
                {trial.phases.length > 0 && <> · {trial.phases.join(', ')}</>}
              </p>
              <p className="truncate" title={trial.sponsor}>{trial.sponsor}</p>
              {trial.locations && trial.locations.length > 0 && (
                <p className="text-gray-400">
                  {trial.locations.length} site{trial.locations.length === 1 ? '' : 's'}
                  {trial.locations[0].precision ? ` · ${trial.locations[0].precision}` : ''}
                </p>
              )}
            </div>
            <a
              href={`https://clinicaltrials.gov/study/${trial.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-medium text-accent hover:text-accent-hover"
            >
              {trial.id} ↗
            </a>
          </div>
        </Popup>
      );
    }

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
          <div className="p-2 bg-white rounded-lg shadow-[var(--shadow-lift)] max-w-xs w-64">
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
    <div className="relative h-full w-full">
    <MapGL
      ref={mapRef}
      {...mapViewState}
      onMove={(evt) => setMapViewState(evt.viewState)}
      onMoveEnd={handleMapInteraction}
      onZoomEnd={handleMapInteraction}
      onLoad={handleMapInteraction}
      onMouseDown={(e) => { downPoint.current = { x: e.point.x, y: e.point.y }; }}
      onClick={(e) => {
        const down = downPoint.current;
        const travelled = down
          ? Math.hypot(e.point.x - down.x, e.point.y - down.y)
          : 0;
        // More than a few pixels means a pan, not a click.
        if (travelled > 4) return;
        handleMapClick(e);
      }}
      // Without this, `e.features` in the click handler is always empty and the
      // county choropleth is never clickable -- the handler looks correct and
      // silently does nothing.
      interactiveLayerIds={isCorrelationMode ? ['county-choropleth'] : []}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      {currentZoom < CLUSTER_THRESHOLD
        ? shownMap.map((item) => {
            if (item.is_cluster) {
              const cluster = item as ApiCluster;
              const v = clusterVisual(cluster.point_count, maxCluster);
              return (
                <Marker
                  key={`server-cluster-${cluster.latitude}-${cluster.longitude}`}
                  latitude={cluster.latitude}
                  longitude={cluster.longitude}
                >
                  <div
                    className="flex cursor-pointer items-center justify-center rounded-full text-[11px] font-medium text-white shadow-sm transition-transform duration-150 hover:scale-110"
                    style={{ width: `${v.size}px`, height: `${v.size}px`, backgroundColor: v.color }}
                    onMouseEnter={() => setHovered({
                      longitude: cluster.longitude,
                      latitude: cluster.latitude,
                      title: `${cluster.point_count.toLocaleString()} trials`,
                      meta: 'Shown in the sidebar\nClick to zoom',
                    })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      markMarkerClick();
                      setMapViewState({
                        ...mapViewState,
                        latitude: cluster.latitude,
                        longitude: cluster.longitude,
                        zoom: (mapViewState.zoom ?? 0) + 2,
                      });
                    }}
                  >
                    {cluster.point_count.toLocaleString()}
                  </div>
                </Marker>
              );
            }
            // A location hosting several studies. Sized on a log scale so a hub
            // with 15,000 studies does not produce a marker wider than the state.
            if (item.is_site) {
              const site = item as Site;
              const size = Math.min(64, 26 + Math.log10(Math.max(site.point_count, 1)) * 12);
              return (
                <Marker
                  key={`site-${site.latitude}-${site.longitude}`}
                  latitude={site.latitude}
                  longitude={site.longitude}
                >
                  <div
                    className="flex cursor-pointer items-center justify-center rounded-full text-[11px] font-medium text-white shadow-sm transition-transform duration-150 hover:scale-110"
                    style={{ width: `${size}px`, height: `${size}px`, backgroundColor: CLUSTER_RAMP[3] }}
                    title={`${site.point_count} trials at this location`}
                    onMouseEnter={() => setHovered({
                      longitude: site.longitude, latitude: site.latitude,
                      title: `${site.point_count.toLocaleString()} trials`,
                      meta: 'Shown in the sidebar\nClick to list trials',
                    })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      markMarkerClick();
                      setActivePopup({
                        type: 'multi',
                        data: site.trials,
                        total: site.point_count,
                        longitude: site.longitude,
                        latitude: site.latitude,
                      });
                    }}
                  >
                    {site.point_count}
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
                  onMouseEnter={() => setHovered({
                    longitude: loc.longitude,
                    latitude: loc.latitude,
                    title: trial.title.length > 58 ? trial.title.slice(0, 58) + '…' : trial.title,
                    meta: [trial.status, loc.city].filter(Boolean).join(' · '),
                  })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    markMarkerClick();
                    setActivePopup({
                      type: 'trial',
                      data: trial,
                      longitude: loc.longitude,
                      latitude: loc.latitude,
                    });
                  }}
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
                    className="flex cursor-pointer items-center justify-center rounded-full text-[11px] font-medium text-white shadow-sm transition-transform duration-150 hover:scale-110"
                    style={{
                      width: `${clusterVisual(pointCount, maxCluster).size}px`,
                      height: `${clusterVisual(pointCount, maxCluster).size}px`,
                      backgroundColor: clusterVisual(pointCount, maxCluster).color,
                    }}
                    onMouseEnter={() => setHovered({
                      longitude, latitude,
                      title: `${pointCount.toLocaleString()} trials`,
                      meta: clusterCanExpand(cluster.id as number)
                        ? 'Shown in the sidebar\nClick to zoom'
                        : 'Shown in the sidebar\nClick to list trials',
                    })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      markMarkerClick();
                      const canExpand = clusterCanExpand(cluster.id as number);
                      const raw = supercluster?.getClusterExpansionZoom(cluster.id as number)
                        ?? MAX_CLUSTER_ZOOM;

                      // A cluster can stop separating before the map's ceiling:
                      // its points may share a coordinate, or its expansion zoom
                      // may already be the current zoom. At or near the ceiling,
                      // zooming again would redraw the same purple dot, so it
                      // opens the list instead. A grouping is still a way to
                      // reach a trial the user actually wants.
                      if (!canExpand) {
                        const leaves = supercluster?.getLeaves(cluster.id as number, 20) ?? [];
                        // Leaves are location points, so a trial with more than
                        // one point here would otherwise appear twice.
                        const byId = new Map<string, Trial>();
                        for (const leaf of leaves) {
                          const t = trialById.get(
                            (leaf.properties as { trialId?: string }).trialId ?? '');
                          if (t) byId.set(t.id, t);
                        }
                        const list = [...byId.values()];
                        if (list.length > 0) {
                          setActivePopup({
                            type: 'multi',
                            data: list,
                            total: pointCount,
                            longitude,
                            latitude,
                          });
                          return;
                        }
                      }
                      setMapViewState({
                        ...mapViewState,
                        latitude,
                        longitude,
                        zoom: Math.min(raw, MAX_CLUSTER_ZOOM),
                      });
                    }}
                  >
                    {pointCount}
                  </div>
                </Marker>
              );
            }
            // Individual points above the server threshold. These had no click
            // handler and no cursor at all -- the pins above CLUSTER_THRESHOLD
            // were decorative, which is why clicking one did nothing.
            const trial = trialById.get(props.trialId ?? '');
            if (!trial) {
              return (
                <Marker
                  key={`trial-${props.locationKey ?? `${latitude}-${longitude}`}`}
                  latitude={latitude}
                  longitude={longitude}
                >
                  <div style={{ fontSize: '20px' }}>📍</div>
                </Marker>
              );
            }
            return (
              <Marker
                key={`trial-${props.locationKey ?? `${latitude}-${longitude}`}`}
                latitude={latitude}
                longitude={longitude}
              >
                <div
                  style={{ fontSize: '20px', cursor: 'pointer' }}
                  className={
                    props.precision === 'country' || props.precision === 'admin1'
                      ? 'opacity-40'
                      : ''
                  }
                  onMouseEnter={() =>
                    setHovered({
                      longitude,
                      latitude,
                      title:
                        trial.title.length > 58
                          ? trial.title.slice(0, 58) + '…'
                          : trial.title,
                      meta: [trial.status, trial.locations?.[0]?.city]
                        .filter(Boolean)
                        .join(' · '),
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    markMarkerClick();
                    setActivePopup({
                      type: 'trial',
                      data: trial,
                      longitude,
                      latitude,
                    });
                  }}
                >
                  📍
                </div>
              </Marker>
            );
          })}
      {renderPopup()}

      {/* Hover card. Pointer-events off so it never blocks the marker beneath. */}
      {hovered && (
        <Popup
          longitude={hovered.longitude}
          latitude={hovered.latitude}
          closeButton={false}
          closeOnClick={false}
          anchor="top"
          offset={14}
          className="pointer-events-none"
        >
          <div className="max-w-[240px] rounded-lg border border-line bg-surface px-3 py-2 shadow-[var(--shadow-lift)]">
            <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">
              {hovered.title}
            </p>
            {hovered.meta && (
              <p className="mt-0.5 whitespace-pre-line text-[11px] text-muted">
                {hovered.meta}
              </p>
            )}
          </div>
        </Popup>
      )}
    </MapGL>

      {/* What the current viewport holds. Without it the map filters invisibly
          and the user cannot tell whether their panning did anything. */}
      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <div className="tnum rounded-full border border-line bg-surface/95 px-3 py-1.5 text-[12px] font-medium text-ink shadow-sm backdrop-blur-sm">
          {viewportTotal.toLocaleString()} {viewportTotal === 1 ? 'trial' : 'trials'} in view
        </div>
      </div>
    </div>
  );
};

export default MapView;
