import React from 'react';
import { useSearchStore } from '@/store/useSearchStore';

export default function StatusBanner() {
  const { loading, error, items } = useSearchStore((s) => ({
    loading: s.loading,
    error: s.error,
    items: s.items,
  }));

  return (
    <div className="grid gap-1">
      {loading ? (
        <div role="status" aria-live="polite" className="text-sm text-gray-300">
          Searching…
        </div>
      ) : null}
      {error ? (
        <div role="alert" aria-live="polite" className="text-sm text-red-400">
          {error.message}
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="text-xs text-gray-400">Results: {items.length} (showing up to 50)</div>
      ) : null}
    </div>
  );
}
