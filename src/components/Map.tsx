import React, { useEffect, useMemo, useRef } from 'react';
import maplibregl, { Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSearchStore } from '@/store/useSearchStore';

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);

  const { items, selectedId, filters, setMapBBoxGetter, suppressNextFit } = useSearchStore((s) => ({
    items: s.items,
    selectedId: s.selectedId,
    filters: s.filters,
    setMapBBoxGetter: s.setMapBBoxGetter,
    suppressNextFit: s.suppressNextFit,
  }));

  const featureCollection = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: items
        .filter((i) => i.geometry)
        .map((i) => ({ type: 'Feature', id: i.id, geometry: i.geometry, properties: { id: i.id } })),
    } as GeoJSON.FeatureCollection;
  }, [items]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const baseStyle: any = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    };
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle,
      center: [-107.88, 37.28],
      zoom: 8,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('items', { type: 'geojson', data: featureCollection });
      map.addLayer({ id: 'footprints-line', type: 'line', source: 'items', paint: { 'line-color': '#64748b', 'line-width': 1.2 } });
      // Hover layer (cyan) sits above base lines but below selected highlight
      map.addLayer({ id: 'footprints-hover', type: 'line', source: 'items', filter: ['==', ['get','id'], ''], paint: { 'line-color': '#00f0ff', 'line-width': 2.6 } });
      // Selected highlight (magenta) on top
      map.addLayer({ id: 'footprints-highlight', type: 'line', source: 'items', filter: ['==', ['get','id'], ''], paint: { 'line-color': '#ff2e92', 'line-width': 3 } });
    });

    setMapBBoxGetter(() => {
      const b = map.getBounds();
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] as [number, number, number, number];
    });

    return () => {
      setMapBBoxGetter(undefined);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  type BoundsArray = [[number, number], [number, number]];

  function geometryBounds(geom: any): BoundsArray | null {
    if (!geom) return null;
    const coords: number[][] = [];
    const walk = (g: any) => {
      const t = g?.type;
      const c = g?.coordinates;
      if (!t || !c) return;
      if (t === 'Point') coords.push(c);
      else if (t === 'MultiPoint' || t === 'LineString') coords.push(...c);
      else if (t === 'MultiLineString' || t === 'Polygon') coords.push(...c.flat());
      else if (t === 'MultiPolygon') coords.push(...c.flat(2));
      else if (t === 'GeometryCollection') (g.geometries || []).forEach(walk);
    };
    walk(geom);
    if (!coords.length) return null;
    let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < w) w = lng;
      if (lat < s) s = lat;
      if (lng > e) e = lng;
      if (lat > n) n = lat;
    }
    return [[w, s], [e, n]];
  }

  function featureCollectionBounds(fc: GeoJSON.FeatureCollection): BoundsArray | null {
    let bounds: BoundsArray | null = null;
    for (const f of fc.features) {
      const b = geometryBounds((f as any).geometry);
      if (!b) continue;
      if (!bounds) bounds = b;
      else {
        const [[w1, s1], [e1, n1]]: BoundsArray = bounds;
        const [[w2, s2], [e2, n2]]: BoundsArray = b;
        bounds = [[Math.min(w1, w2), Math.min(s1, s2)], [Math.max(e1, e2), Math.max(n1, n2)]];
      }
    }
    return bounds;
  }

  // Update source on changes; fit only when not suppressed
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('items') as any;
    if (src && 'setData' in src) src.setData(featureCollection as any);
    if (!suppressNextFit) {
      const fcBounds = featureCollectionBounds(featureCollection);
      if (fcBounds) {
        const [[w, s], [e, n]] = fcBounds as any;
        const b = new maplibregl.LngLatBounds([w, s], [e, n]);
        map.fitBounds(b, { padding: 24, animate: true });
      } else if (filters.bbox) {
        const [w, s, e, n] = filters.bbox;
        const b = new maplibregl.LngLatBounds([w, s], [e, n]);
        map.fitBounds(b, { padding: 24, animate: true });
      }
    }
  }, [featureCollection, filters.bbox, suppressNextFit]);

  // Highlight selection and optional fit
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layerId = 'footprints-highlight';
    if (map.getLayer(layerId)) map.setFilter(layerId, ['==', ['get','id'], selectedId ?? '']);
    if (selectedId && !suppressNextFit) {
      const feat = featureCollection.features.find((f: any) => f.id === selectedId) as any;
      const gb = feat ? geometryBounds(feat.geometry) : null;
      if (gb) {
        const [[w, s], [e, n]] = gb as any;
        const b = new maplibregl.LngLatBounds([w, s], [e, n]);
        map.fitBounds(b, { padding: 32, animate: true });
      }
    }
  }, [selectedId, suppressNextFit, featureCollection]);

  // Hover highlight (no zoom)
  const hoverId = useSearchStore((s) => s.hoverId);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layerId = 'footprints-hover';
    if (map.getLayer(layerId)) map.setFilter(layerId, ['==', ['get','id'], hoverId ?? '']);
  }, [hoverId]);

  // Removed preview overlay feature for now

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      {/* Overlay UI removed */}
    </div>
  );
}
