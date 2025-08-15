import { create } from 'zustand';
import { BBox, Filters, NormalizedItem, StoreError } from '@/types';
import { DEFAULTS, applyFiltersToUrl, decodeFiltersFromLocation } from '@/lib/urlState';
import { buildSearchBody, fetchStac, normalizeFeatures, parseError } from '@/lib/stac';

type State = {
  filters: Filters;
  items: NormalizedItem[];
  selectedId: string | null;
  loading: boolean;
  error: StoreError | null;
  getMapBBox?: () => BBox | null;
  fitResults?: () => void;
  previewOverlay?: { id: string | null; url: string | null };
  suppressNextFit: boolean;
};

type Actions = {
  setFilters: (partial: Partial<Filters>) => void;
  setBBox: (bbox: BBox | null) => void;
  select: (id: string | null) => void;
  search: () => Promise<void>;
  initDefaultsAndSearch: () => Promise<void>;
  setMapBBoxGetter: (fn: (() => BBox | null) | undefined) => void;
  setFitResults: (fn: (() => void) | undefined) => void;
  setPreviewOverlay: (id: string | null, url: string | null) => void;
  setSuppressNextFit: (v: boolean) => void;
};

export const useSearchStore = create<State & Actions>((set, get) => ({
  filters: { ...DEFAULTS },
  items: [],
  selectedId: null,
  loading: false,
  error: null,
  previewOverlay: { id: null, url: null },
  suppressNextFit: false,

  setFilters: (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),
  setBBox: (bbox) => set((s) => ({ filters: { ...s.filters, bbox } })),
  select: (id) => set(() => ({ selectedId: id })),
  setMapBBoxGetter: (fn) => set(() => ({ getMapBBox: fn })),
  setFitResults: (fn) => set(() => ({ fitResults: fn })),
  setPreviewOverlay: (id, url) => set(() => ({ previewOverlay: { id, url } })),
  setSuppressNextFit: (v) => set(() => ({ suppressNextFit: v })),

  search: async () => {
    const { filters } = get();
    if (!filters.bbox) return; // need bbox to search
    set({ loading: true, error: null });
    try {
      const body = buildSearchBody(filters);
      const json = await fetchStac(body);
      const items = normalizeFeatures(json);
      if (!items.length) {
        set({ items: [], loading: false, error: parseError('E02_EMPTY') });
      } else {
        set({ items, loading: false, error: null });
      }
      applyFiltersToUrl(filters, true);
    } catch (e: any) {
      const err: StoreError = e?.code ? e : parseError('E01_NETWORK');
      set({ loading: false, error: err });
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
