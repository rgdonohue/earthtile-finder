import { Filters, NormalizedItem, StoreError } from '@/types';

export function buildSearchBody(f: Filters) {
  if (!f.bbox) throw new Error('bbox required');
  const [w, s, e, n] = f.bbox;
  const bbox = [Math.min(w, e), Math.min(s, n), Math.max(w, e), Math.max(s, n)];
  const datetime = `${toStartOfDayZ(f.startDate)}/${toEndOfDayZ(f.endDate)}`;
  return {
    collections: f.collections,
    bbox,
    datetime,
    limit: 50,
    query: {
      'eo:cloud_cover': { lt: Number(f.cloudLt) },
    },
  };
}

function toStartOfDayZ(d: string) {
  // Expects YYYY-MM-DD; fallback to pass-through if not matching
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00Z` : d;
}

function toEndOfDayZ(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T23:59:59Z` : d;
}

export function normalizeFeatures(json: any): NormalizedItem[] {
  try {
    const feats: any[] = json?.features;
    if (!Array.isArray(feats)) {
      // eslint-disable-next-line no-console
      console.error('E03_PARSE normalizeFeatures: features is not an array');
      throw parseError('E03_PARSE');
    }
    return feats.map((f) => {
      const props = f.properties || {};
      const datetime = props.datetime || props.start_datetime || props.end_datetime || null;
      const assets = f.assets || props.assets || {};
      const thumb = assets?.thumbnail?.href || pickFirstImageAssetHref(assets) || null;
      const collection = f.collection || props.collection || undefined;
      const cloud =
        typeof props['eo:cloud_cover'] === 'number'
          ? props['eo:cloud_cover']
          : typeof props['s2:cloudy_pixel_percentage'] === 'number'
          ? props['s2:cloudy_pixel_percentage']
          : null;
      return {
        id: f.id || props.id,
        bbox: f.bbox,
        geometry: f.geometry,
        datetime: datetime || undefined,
        thumbnail: thumb,
        collection,
        cloudCover: cloud,
        raw: f,
      } as NormalizedItem;
    });
  } catch (e) {
    if ((e as any)?.code === 'E03_PARSE') throw e as any;
    // Per ERROR_TAXONOMY: log parse issues but keep UI interactive
    // eslint-disable-next-line no-console
    console.error('E03_PARSE normalizeFeatures error', e);
    throw parseError('E03_PARSE');
  }
}

function pickFirstImageAssetHref(assets: any): string | null {
  for (const k of Object.keys(assets || {})) {
    const a = assets[k];
    const type = a?.type || a?.['content-type'] || '';
    if (typeof type === 'string' && /image\/(png|jpeg)/.test(type)) return a.href || null;
  }
  return null;
}

export async function fetchStac(body: any, endpoint?: string) {
  const base = (import.meta as any).env?.VITE_STAC_BASE || 'https://earth-search.aws.element84.com/v1';
  const url = (endpoint ?? `${String(base).replace(/\/$/, '')}/search`) as string;
  const offline = String((import.meta as any).env?.VITE_STAC_OFFLINE || 'false') === 'true';
  if (offline) {
    const fallback = await fetch('/sample.json');
    return await fallback.json();
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw parseError('E01_NETWORK');
    return await res.json();
  } catch (e) {
    // Fallback to local sample for demos/offline safety
    try {
      const fallback = await fetch('/sample.json');
      return await fallback.json();
    } catch {
      throw parseError('E01_NETWORK');
    }
  }
}

export function parseError(code: StoreError['code']): StoreError {
  const messages: Record<StoreError['code'], string> = {
    E01_NETWORK: 'Search failed. Try adjusting filters or reload.',
    E02_EMPTY: 'No results. Try widening date or bbox.',
    E03_PARSE: 'Search failed. Try adjusting filters or reload.',
  };
  return { code, message: messages[code] };
}
