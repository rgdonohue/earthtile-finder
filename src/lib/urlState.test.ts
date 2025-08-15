import { describe, it, expect } from 'vitest';
import { DEFAULTS, encodeFiltersToSearchParams, decodeFiltersFromLocation } from './urlState';

describe('urlState', () => {
  it('encodes and decodes filters', () => {
    const params = encodeFiltersToSearchParams(DEFAULTS);
    const url = `/?${params.toString()}`;
    const fakeLoc = { search: new URL(url, 'http://localhost').search } as any as Location;
    const decoded = decodeFiltersFromLocation(fakeLoc, DEFAULTS);
    expect(decoded).toEqual(DEFAULTS);
  });
});

