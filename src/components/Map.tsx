import React, { useEffect, useMemo, useRef } from 'react';
import maplibregl, { Map as MLMap, LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSearchStore } from '@/store/useSearchStore';

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);

  const { items, selectedId, filters, setMapBBoxGetter, setFitResults, previewOverlay } = useSearchStore((s) => ({
    items: s.items,
    selectedId: s.selectedId,
    filters: s.filters,
    setMapBBoxGetter: s.setMapBBoxGetter,
    setFitResults: s.setFitResults,
    previewOverlay: s.previewOverlay,
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
      map.addLayer({
        id: 'footprints-line',
        type: 'line',
        source: 'items',
        paint: { 'line-color': '#007aff', 'line-width': 1.5 },
      });
      map.addLayer({
        id: 'footprints-highlight',
        type: 'line',
        source: 'items',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'line-color': '#ff3b30', 'line-width': 3 },
      });
    });

    // Expose map bbox getter to Controls
    setMapBBoxGetter(() => {
      const b = map.getBounds();
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] as any;
    });
    setFitResults(() => () => {
      const fcBounds = featureCollectionBounds(featureCollection);
      if (fcBounds) map.fitBounds(fcBounds, { padding: 24, animate: true });
      else if (filters.bbox) {
        const b = filters.bbox;
        map.fitBounds([
          [b[0], b[1]],
          [b[2], b[3]],
        ], { padding: 24, animate: true });
      }
    });

    return () => {
      setMapBBoxGetter(undefined);
      setFitResults(undefined);
      map.remove();
      mapRef.current = null;
    };
  }, [featureCollection, setMapBBoxGetter]);

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
    return [ [w, s], [e, n] ];
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
        bounds = [ [Math.min(w1, w2), Math.min(s1, s2)], [Math.max(e1, e2), Math.max(n1, n2)] ];
      }
    }
    return bounds;
  }

  // Update source data when items change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('items') as any;
    if (src && 'setData' in src) src.setData(featureCollection as any);
    // fit to data if available; otherwise to current filters bbox
    const fcBounds = featureCollectionBounds(featureCollection);
    if (fcBounds) {
      map.fitBounds(fcBounds, { padding: 24, animate: true });
    } else if (filters.bbox) {
      const b = filters.bbox;
      map.fitBounds([
        [b[0], b[1]],
        [b[2], b[3]],
      ], { padding: 24, animate: true });
    }
  }, [featureCollection, filters.bbox]);

  // Update highlight when selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layerId = 'footprints-highlight';
    if (map.getLayer(layerId)) {
      map.setFilter(layerId, ['==', ['get', 'id'], selectedId ?? '']);
    }
    // Also fit to selected feature
    if (selectedId) {
      const feat = featureCollection.features.find((f: any) => f.id === selectedId) as any;
      const b = feat ? geometryBounds(feat.geometry) : null;
      if (b) map.fitBounds(b, { padding: 32, animate: true });
    }
  }, [selectedId]);

  // Update preview overlay using TiTiler tiles when available, else image overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const overlay = previewOverlay;
    const imageLayerId = 'preview-image-layer';
    const imageSourceId = 'preview-image';
    const tileLayerId = 'preview-tiles-layer';
    const tileSourceId = 'preview-tiles';
    if (!overlay?.url || !overlay?.id) {
      if (map.getLayer(imageLayerId)) map.removeLayer(imageLayerId);
      if (map.getSource(imageSourceId)) map.removeSource(imageSourceId);
      if (map.getLayer(tileLayerId)) map.removeLayer(tileLayerId);
      if (map.getSource(tileSourceId)) map.removeSource(tileSourceId);
      return;
    }
    const feat = featureCollection.features.find((f: any) => f.id === overlay.id) as any;
    const b = feat
      ? geometryBounds(feat.geometry)
      : filters.bbox
      ? ([
          [filters.bbox[0], filters.bbox[1]],
          [filters.bbox[2], filters.bbox[3]],
        ] as any)
      : null;
    if (!b) return;

    if (overlay.url.includes('{z}') && overlay.url.includes('{x}') && overlay.url.includes('{y}')) {
      // TiTiler raster tiles
      if (map.getLayer(imageLayerId)) map.removeLayer(imageLayerId);
      if (map.getSource(imageSourceId)) map.removeSource(imageSourceId);
      if (!map.getSource(tileSourceId)) {
        map.addSource(tileSourceId, {
          type: 'raster',
          tiles: [overlay.url],
          tileSize: 256,
        } as any);
        map.addLayer({ id: tileLayerId, type: 'raster', source: tileSourceId, paint: { 'raster-opacity': 0.9 } });
      } else {
        if (map.getLayer(tileLayerId)) map.removeLayer(tileLayerId);
        if (map.getSource(tileSourceId)) map.removeSource(tileSourceId);
        map.addSource(tileSourceId, { type: 'raster', tiles: [overlay.url], tileSize: 256 } as any);
        map.addLayer({ id: tileLayerId, type: 'raster', source: tileSourceId, paint: { 'raster-opacity': 0.9 } });
      }
    } else {
      // Image overlay using bounds
      const [[w, s], [e, n]] = b as any;
      const coords = [
        [w, n],
        [e, n],
        [e, s],
        [w, s],
      ] as any;
      if (map.getLayer(tileLayerId)) map.removeLayer(tileLayerId);
      if (map.getSource(tileSourceId)) map.removeSource(tileSourceId);
      if (!map.getSource(imageSourceId)) {
        map.addSource(imageSourceId, { type: 'image', url: overlay.url, coordinates: coords } as any);
        map.addLayer({ id: imageLayerId, type: 'raster', source: imageSourceId, paint: { 'raster-opacity': 0.9 } });
      } else {
        const src = map.getSource(imageSourceId) as any;
        if (src && 'updateImage' in src) src.updateImage({ url: overlay.url, coordinates: coords });
      }
    }
  }, [previewOverlay, featureCollection, filters.bbox]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
