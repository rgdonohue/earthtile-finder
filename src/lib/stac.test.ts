import { describe, it, expect, vi } from 'vitest';
import { buildSearchBody, normalizeFeatures, fetchStac } from './stac';
import type { Filters } from '@/types';

const filters: Filters = {
  bbox: [-108.2, 37.1, -107.6, 37.5],
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  cloudLt: 20,
  collections: ['sentinel-2-l2a'],
};

describe('stac.ts', () => {
  it('builds POST body per API_CONTRACTS', () => {
    const body = buildSearchBody(filters);
    expect(body).toEqual({
      collections: ['sentinel-2-l2a'],
      bbox: [-108.2, 37.1, -107.6, 37.5],
      datetime: '2024-01-01T00:00:00Z/2024-01-31T23:59:59Z',
      limit: 50,
      query: { 'eo:cloud_cover': { lt: 20 } },
    });
  });

  it('normalizes features with thumbnail fallback and props', () => {
    const json = {
      features: [
        {
          id: 'a',
          bbox: [0, 0, 1, 1],
          collection: 'sentinel-2-l2a',
          properties: { datetime: '2024-01-02T00:00:00Z', 'eo:cloud_cover': 12 },
          assets: {
            image: { href: 'https://x/y.png', type: 'image/png' },
          },
        },
      ],
    };
    const norm = normalizeFeatures(json);
    expect(norm[0].id).toBe('a');
    expect(norm[0].thumbnail).toBe('https://x/y.png');
    expect(norm[0].collection).toBe('sentinel-2-l2a');
    expect(norm[0].cloudCover).toBe(12);
  });

  it('fetchStac falls back to /sample.json on error', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) } as any);
    vi.stubGlobal('fetch', fetchMock as any);

    const result = await fetchStac({ hello: 'world' }, 'https://invalid.example.com');
    expect(result).toEqual({ features: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock as any).mock.calls[1][0]).toBe('/sample.json');

    vi.unstubAllGlobals();
  });

  it('throws E03_PARSE on malformed response and logs', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => normalizeFeatures(null as any)).toThrowError();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
