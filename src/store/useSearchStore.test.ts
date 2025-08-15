import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSearchStore } from './useSearchStore';
import { DEFAULTS } from '@/lib/urlState';

vi.mock('@/lib/stac', async () => {
  return {
    buildSearchBody: vi.fn(() => ({})),
    fetchStac: vi.fn(async () => ({})),
    normalizeFeatures: vi.fn(() => []),
    parseError: (code: any) => ({ code, message: 'x' }),
  };
});

describe('useSearchStore', () => {
  beforeEach(() => {
    // reset store to defaults
    useSearchStore.setState({
      filters: { ...DEFAULTS },
      items: [],
      selectedId: null,
      loading: false,
      error: null,
    } as any);
  });

  it('sets E02_EMPTY when no items', async () => {
    // ensure bbox exists
    useSearchStore.getState().setBBox(DEFAULTS.bbox);
    await useSearchStore.getState().search();
    const err = useSearchStore.getState().error;
    expect(err?.code).toBe('E02_EMPTY');
  });
});

