import React, { useEffect } from 'react';
import Controls from '@/components/Controls';
import ResultsGrid from '@/components/ResultsGrid';
import Map from '@/components/Map';
import { useSearchStore } from '@/store/useSearchStore';
import ItemDetails from '@/components/ItemDetails';

export default function App() {
  const init = useSearchStore((s) => s.initDefaultsAndSearch);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="h-screen w-screen grid grid-cols-1 md:grid-cols-[440px_1fr] bg-slate-900 text-gray-300">
      <aside className="relative border-r border-slate-800/60 p-4 md:p-6 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="EarthTile logo" className="w-8 h-8 select-none" />
          <h1 className="mt-0 text-xl font-semibold tracking-wide text-white">EarthTile Finder</h1>
        </div>
        <p className="mb-4 text-sm text-gray-300">
          An interface for exploring rich, open geospatial datasets via STAC.
          Search your map extent by date and cloud cover, scan thumbnails, preview imagery on the
          map, and download assets like Sentinel‑2 visual and band COGs directly (click Details below).
        </p>
        <Controls />
        <div className="mt-4 space-y-4 flex-1 overflow-y-auto">
          <ResultsGrid />
          <ItemDetails />
        </div>
      </aside>
      <main className="relative">
        <Map />
      </main>
    </div>
  );
}
