import { create } from 'zustand';
import { BBox, Filters, NormalizedItem, StoreError } from '@/types';
import { DEFAULTS, applyFiltersToUrl, decodeFiltersFromLocation } from '@/lib/urlState';
import { buildSearchBody, fetchStac, normalizeFeatures, parseError } from '@/lib/stac';

type State = {
  filters: Filters;
  items: NormalizedItem[];
  selectedId: string | null;
  hoverId: string | null;
  loading: boolean;
  error: StoreError | null;
  getMapBBox?: () => BBox | null;
  suppressNextFit: boolean;
  // overlay removed
};

type Actions = {
  setFilters: (partial: Partial<Filters>) => void;
  setBBox: (bbox: BBox | null) => void;
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  search: () => Promise<void>;
  initDefaultsAndSearch: () => Promise<void>;
  setMapBBoxGetter: (fn: (() => BBox | null) | undefined) => void;
  setSuppressNextFit: (v: boolean) => void;
};

export const useSearchStore = create<State & Actions>((set, get) => ({
  filters: { ...DEFAULTS },
  items: [],
  selectedId: null,
  hoverId: null,
  loading: false,
  error: null,
  suppressNextFit: false,
  

  setFilters: (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),
  setBBox: (bbox) => set((s) => ({ filters: { ...s.filters, bbox } })),
  select: (id) => set(() => ({ selectedId: id, suppressNextFit: false })),
  setHover: (id) => set(() => ({ hoverId: id })),
  setMapBBoxGetter: (fn) => set(() => ({ getMapBBox: fn })),
  setSuppressNextFit: (v) => set(() => ({ suppressNextFit: v })),
  

  search: async () => {
    const { filters } = get();
    if (!filters.bbox) return; // need bbox to search
    set({ loading: true, error: null, selectedId: null });
    try {
      const body = buildSearchBody(filters);
      const json = await fetchStac(body);
      const items = normalizeFeatures(json);
      if (!items.length) {
        set({ items: [], loading: false, error: parseError('E02_EMPTY'), suppressNextFit: false });
      } else {
        set({ items, loading: false, error: null, suppressNextFit: false });
      }
      applyFiltersToUrl(filters, true);
    } catch (e: any) {
      const err: StoreError = e?.code ? e : parseError('E01_NETWORK');
      set({ loading: false, error: err, suppressNextFit: false });
    }
  },

  initDefaultsAndSearch: async () => {
    // Initialize filters from URL if present; otherwise defaults
    const fromUrl = decodeFiltersFromLocation(window.location, DEFAULTS);
    set({ filters: fromUrl });
    applyFiltersToUrl(fromUrl, true);
    await get().search();
  },
}));
