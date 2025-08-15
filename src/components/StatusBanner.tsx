import React from 'react';
import { useSearchStore } from '@/store/useSearchStore';

export default function StatusBanner() {
  const { loading, error, items } = useSearchStore((s) => ({
    loading: s.loading,
    error: s.error,
    items: s.items,
  }));

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {loading ? (
        <div role="status" aria-live="polite" style={{ color: '#333' }}>
          Searching…
        </div>
      ) : null}
      {error ? (
        <div role="alert" aria-live="polite" style={{ color: 'crimson' }}>
          {error.message}
        </div>
      ) : null}
      {!loading && !error ? (
        <div style={{ color: '#666', fontSize: 13 }}>
          Results: {items.length} (showing up to 50)
        </div>
      ) : null}
    </div>
  );
}

