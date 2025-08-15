import React from 'react';
import { useSearchStore } from '@/store/useSearchStore';
import StatusBanner from '@/components/StatusBanner';

export default function Controls() {
  const { filters, setFilters, setBBox, search, loading, getMapBBox, setSuppressNextFit } =
    useSearchStore();

  const btnBase =
    'rounded-lg border border-slate-700/50 px-3 py-2 text-sm transition-all ' +
    'hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10 ' +
    'focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-0 ' +
    'bg-slate-800/60 backdrop-blur-sm';

  const inputBase =
    'mt-1 w-full rounded-lg bg-slate-800/70 border border-slate-700/60 px-3 py-2 ' +
    'text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none ' +
    'focus:ring-2 focus:ring-cyan-400/70';

  return (
    <div className="grid gap-3 text-sm">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          className={btnBase + ' text-gray-200 w-full sm:w-auto sm:basis-1/2'}
          onClick={() => {
            const b = getMapBBox?.();
            if (b) {
              setBBox(b);
              setSuppressNextFit(true); // do not auto-fit after search
              search();
            }
          }}
          disabled={loading}
        >
          Search Map Extent
        </button>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-gray-400">Cloud ≤</label>
          <input
            className="w-full accent-cyan-400"
            type="range"
            min={0}
            max={80}
            value={filters.cloudLt}
            onChange={(e) => setFilters({ cloudLt: Number(e.target.value) })}
            onPointerUp={() => search()}
            onKeyUp={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
                search();
              }
            }}
          />
          <span className="text-xs text-gray-400">{filters.cloudLt}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <label className="text-xs text-gray-400">Start Date</label>
          <input
            className={inputBase + ' w-full'}
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ startDate: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-gray-400">End Date</label>
          <input
            className={inputBase + ' w-full'}
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-1">
        <StatusBanner />
        <div className="text-xs text-gray-500 mt-1">Showing up to 50 results</div>
      </div>
    </div>
  );
}
