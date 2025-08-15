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
    <div className="h-screen w-screen grid grid-cols-1 md:grid-cols-[360px_1fr] bg-slate-900 text-gray-300">
      <aside className="relative overflow-y-auto border-r border-slate-800/60 p-4 md:p-6">
        <h1 className="mt-0 mb-4 text-xl font-semibold tracking-wide text-white">
          STAC Scene Finder
        </h1>
        <Controls />
        <div className="mt-4 space-y-4">
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
