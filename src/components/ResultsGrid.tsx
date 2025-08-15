import React, { useEffect } from 'react';
import { useSearchStore } from '@/store/useSearchStore';
const fmt = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default function ResultsGrid() {
  const { items, selectedId, select } = useSearchStore((s) => ({
    items: s.items,
    selectedId: s.selectedId,
    select: s.select,
  }));

  if (!items.length) return <div>No items</div>;

  return (
    <div
      role="list"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      onKeyDown={(e) => {
        const cols = 2;
        const currentIdx = Math.max(
          0,
          items.findIndex((it) => it.id === selectedId)
        );
        let nextIdx = currentIdx;
        if (e.key === 'ArrowRight') nextIdx = Math.min(items.length - 1, currentIdx + 1);
        if (e.key === 'ArrowLeft') nextIdx = Math.max(0, currentIdx - 1);
        if (e.key === 'ArrowDown') nextIdx = Math.min(items.length - 1, currentIdx + cols);
        if (e.key === 'ArrowUp') nextIdx = Math.max(0, currentIdx - cols);
        if (nextIdx !== currentIdx) {
          e.preventDefault();
          const id = items[nextIdx]?.id;
          if (id) select(id);
        }
      }}
    >
      {items.map((it) => (
        <div
          key={it.id}
          id={`card-${String(it.id)}`}
          role="listitem"
          aria-pressed={selectedId === it.id}
          aria-selected={selectedId === it.id}
          onClick={() => select(it.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              select(it.id);
            }
          }}
          className={
            'group rounded-xl border text-left p-2 sm:p-3 transition-transform transition-colors duration-150 ease-out ' +
            'bg-slate-800/60 border-slate-700/50 backdrop-blur-sm hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 ' +
            (selectedId === it.id ? 'ring-2 ring-cyan-400' : '')
          }
        >
          {it.thumbnail ? (
            <img src={it.thumbnail} alt="thumbnail" className="w-full h-28 object-cover rounded-lg" />
          ) : (
            <div className="w-full h-28 bg-slate-700/50 rounded" />
          )}
          <div className="mt-2">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold tracking-wide text-gray-100">{it.collection || 'item'}</span>
              <span className="text-xs text-gray-400">{it.cloudCover ?? '—'}% cc</span>
            </div>
            <div className="text-xs text-gray-400">{it.datetime ? fmt.format(new Date(it.datetime)) : '—'}</div>
            <div className="text-[10px] text-gray-500 truncate">{it.id}</div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const ev = new CustomEvent('open-item-details', { detail: { id: it.id } });
                  window.dispatchEvent(ev);
                }}
                className="rounded-lg border border-slate-700/50 px-2 py-1 text-xs text-gray-200 hover:border-transparent hover:shadow-cyan-500/10 hover:shadow-lg transition-all"
              >
                Details
              </button>
              {it.visualHref ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(it.visualHref!, '_blank', 'noopener');
                  }}
                  className="rounded-lg border border-slate-700/50 px-2 py-1 text-xs text-gray-200 hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
                >
                  Download
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Keep the selected card in view when selection changes
function useScrollSelectedIntoView(selectedId: string | null) {
  useEffect(() => {
    if (!selectedId) return;
    const el = document.getElementById(`card-${String(selectedId)}`);
    if (el && 'scrollIntoView' in el) {
      (el as any).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedId]);
}
