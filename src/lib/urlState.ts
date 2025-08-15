import { Filters } from '@/types';

export const DEFAULTS: Filters = {
  // Approximate Durango, CO area
  bbox: [-108.2, 37.1, -107.6, 37.5],
  startDate: isoDateOffset(-30),
  endDate: isoDateOffset(0),
  cloudLt: 20,
  collections: ['sentinel-2-l2a'],
};

export function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function encodeFiltersToSearchParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.bbox) p.set('bbox', f.bbox.join(','));
  p.set('start', f.startDate);
  p.set('end', f.endDate);
  p.set('cloudLt', String(f.cloudLt));
  if (f.collections?.length) p.set('collections', f.collections.join(','));
  return p;
}

export function decodeFiltersFromLocation(loc: Location, fallback: Filters = DEFAULTS): Filters {
  const p = new URLSearchParams(loc.search);
  const bboxStr = p.get('bbox');
  const bbox = bboxStr ? (bboxStr.split(',').map(Number) as any) : fallback.bbox;
  const start = p.get('start') ?? fallback.startDate;
  const end = p.get('end') ?? fallback.endDate;
  const cloudLt = p.get('cloudLt') ? Number(p.get('cloudLt')) : fallback.cloudLt;
  const collections = p.get('collections')?.split(',') ?? fallback.collections;
  return { bbox, startDate: start, endDate: end, cloudLt, collections };
}

export function applyFiltersToUrl(f: Filters, replace = true) {
  const params = encodeFiltersToSearchParams(f);
  const url = `${location.pathname}?${params.toString()}`;
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
}

