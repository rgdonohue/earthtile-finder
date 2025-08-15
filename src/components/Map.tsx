import React, { useEffect, useMemo, useRef } from 'react';
import maplibregl, { Map as MLMap, LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSearchStore } from '@/store/useSearchStore';

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);

  const {
    items,
    selectedId,
    filters,
    setMapBBoxGetter,
    previewOverlay,
    suppressNextFit,
    overlayVisible,
    overlayOpacity,
    setOverlayVisible,
    setOverlayOpacity,
  } = useSearchStore((s) => ({
    items: s.items,
    selectedId: s.selectedId,
    filters: s.filters,
    setMapBBoxGetter: s.setMapBBoxGetter,
    previewOverlay: s.previewOverlay,
    suppressNextFit: s.suppressNextFit,
    overlayVisible: s.overlayVisible,
    overlayOpacity: s.overlayOpacity,
    setOverlayVisible: s.setOverlayVisible,
    setOverlayOpacity: s.setOverlayOpacity,
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
      map.addLayer({ id: 'footprints-line', type: 'line', source: 'items', paint: { 'line-color': '#00f0ff', 'line-width': 1.5 } });
      map.addLayer({ id: 'footprints-highlight', type: 'line', source: 'items', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': '#ff2e92', 'line-width': 3 } });
    });

    setMapBBoxGetter(() => {
      const b = map.getBounds();
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] as any;
    });

    return () => {
      setMapBBoxGetter(undefined);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function geometryBounds(geom: any): LngLatBoundsLike | null {
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

  function featureCollectionBounds(fc: GeoJSON.FeatureCollection): LngLatBoundsLike | null {
    let bounds: LngLatBoundsLike | null = null;
    for (const f of fc.features) {
      const b = geometryBounds((f as any).geometry);
      if (!b) continue;
      if (!bounds) bounds = b;
      else {
        const [[w1, s1], [e1, n1]] = bounds;
        const [[w2, s2], [e2, n2]] = b;
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
      if (fcBounds) map.fitBounds(fcBounds, { padding: 24, animate: true });
      else if (filters.bbox) map.fitBounds([[filters.bbox[0], filters.bbox[1]], [filters.bbox[2], filters.bbox[3]]], { padding: 24, animate: true });
    }
  }, [featureCollection, filters.bbox, suppressNextFit]);

  // Highlight selection and optional fit
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layerId = 'footprints-highlight';
    if (map.getLayer(layerId)) map.setFilter(layerId, ['==', ['get', 'id'], selectedId ?? '']);
    if (selectedId && !suppressNextFit) {
      const feat = featureCollection.features.find((f: any) => f.id === selectedId) as any;
      const b = feat ? geometryBounds(feat.geometry) : null;
      if (b) map.fitBounds(b, { padding: 32, animate: true });
    }
  }, [selectedId, suppressNextFit, featureCollection]);

  // Overlay effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const imageLayerId = 'preview-image-layer';
    const imageSourceId = 'preview-image';
    const tileLayerId = 'preview-tiles-layer';
    const tileSourceId = 'preview-tiles';

    if (!overlayVisible || !previewOverlay?.url || !previewOverlay?.id) {
      if (map.getLayer(imageLayerId)) map.removeLayer(imageLayerId);
      if (map.getSource(imageSourceId)) map.removeSource(imageSourceId);
      if (map.getLayer(tileLayerId)) map.removeLayer(tileLayerId);
      if (map.getSource(tileSourceId)) map.removeSource(tileSourceId);
      return;
    }

    const feat = featureCollection.features.find((f: any) => f.id === previewOverlay.id) as any;
    const b = feat ? geometryBounds(feat.geometry) : (filters.bbox ? [[filters.bbox[0], filters.bbox[1]], [filters.bbox[2], filters.bbox[3]]] : null);
    if (!b) return;

    const url = previewOverlay.url;
    if (url.includes('{z}') && url.includes('{x}') && url.includes('{y}')) {
      if (map.getLayer(imageLayerId)) map.removeLayer(imageLayerId);
      if (map.getSource(imageSourceId)) map.removeSource(imageSourceId);
      if (map.getLayer(tileLayerId)) map.removeLayer(tileLayerId);
      if (map.getSource(tileSourceId)) map.removeSource(tileSourceId);
      map.addSource(tileSourceId, { type: 'raster', tiles: [url], tileSize: 256 } as any);
      map.addLayer({ id: tileLayerId, type: 'raster', source: tileSourceId, paint: { 'raster-opacity': overlayOpacity } });
    } else {
      const [[w, s], [e, n]] = b as any;
      const coords = [[w, n], [e, n], [e, s], [w, s]] as any;
      if (map.getLayer(tileLayerId)) map.removeLayer(tileLayerId);
      if (map.getSource(tileSourceId)) map.removeSource(tileSourceId);
      if (!map.getSource(imageSourceId)) {
        map.addSource(imageSourceId, { type: 'image', url, coordinates: coords } as any);
        map.addLayer({ id: imageLayerId, type: 'raster', source: imageSourceId, paint: { 'raster-opacity': overlayOpacity } });
      } else {
        const src = map.getSource(imageSourceId) as any;
        if (src && 'updateImage' in src) src.updateImage({ url, coordinates: coords });
      }
    }
  }, [previewOverlay, overlayVisible, overlayOpacity, featureCollection, filters.bbox]);

  // Update opacity dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('preview-tiles-layer')) map.setPaintProperty('preview-tiles-layer', 'raster-opacity', overlayOpacity);
    if (map.getLayer('preview-image-layer')) map.setPaintProperty('preview-image-layer', 'raster-opacity', overlayOpacity);
  }, [overlayOpacity]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      {previewOverlay?.url ? (
        <div className="absolute top-2 left-2 z-10 rounded-xl border border-slate-700/50 bg-slate-800/70 backdrop-blur-sm p-2 text-xs text-gray-200 flex items-center gap-2">
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" className="accent-cyan-400" checked={overlayVisible} onChange={(e) => setOverlayVisible(e.target.checked)} />
            Overlay
          </label>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Opacity</span>
            <input type="range" min={0} max={100} value={Math.round(overlayOpacity * 100)} onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)} className="accent-cyan-400" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
