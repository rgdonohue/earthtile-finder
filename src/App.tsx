import React, { useEffect } from 'react';
import Controls from '@/components/Controls';
import ResultsGrid from '@/components/ResultsGrid';
import Map from '@/components/Map';
import { useSearchStore } from '@/store/useSearchStore';

export default function App() {
  const init = useSearchStore((s) => s.initDefaultsAndSearch);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: '100vh' }}>
      <aside style={{ padding: 16, overflow: 'auto', borderRight: '1px solid #eee' }}>
        <h1 style={{ marginTop: 0 }}>STAC Scene Finder</h1>
        <Controls />
        <div style={{ marginTop: 16 }}>
          <ResultsGrid />
        </div>
      </aside>
      <main>
        <Map />
      </main>
    </div>
  );
}
