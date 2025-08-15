import React from 'react';
import { useSearchStore } from '@/store/useSearchStore';
import StatusBanner from '@/components/StatusBanner';

export default function Controls() {
  const { filters, setFilters, setBBox, search, loading, error, getMapBBox, fitResults } =
    useSearchStore();

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            const b = getMapBBox?.();
            if (b) setBBox(b);
          }}
          disabled={loading}
        >
          Use Map Extent
        </button>
        <button onClick={() => search()} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
        <button onClick={() => fitResults?.()} disabled={loading}>
          Reset View
        </button>
      </div>

      <label>
        Start Date
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ startDate: e.target.value })}
        />
      </label>

      <label>
        End Date
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ endDate: e.target.value })}
        />
      </label>

      <label>
        Cloud (lt)
        <input
          type="range"
          min={0}
          max={80}
          value={filters.cloudLt}
          onChange={(e) => setFilters({ cloudLt: Number(e.target.value) })}
        />
        <span>{filters.cloudLt}%</span>
      </label>

      <StatusBanner />
      <div>Showing up to 50 results</div>
    </div>
  );
}
