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
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}
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
        <button
          key={it.id}
          id={`card-${String(it.id)}`}
          role="listitem"
          aria-pressed={selectedId === it.id}
          onClick={() => select(it.id)}
          style={{
            border: selectedId === it.id ? '2px solid dodgerblue' : '1px solid #ddd',
            textAlign: 'left',
            padding: 8,
            outline: 'none',
            boxShadow: selectedId === it.id ? '0 0 0 2px rgba(30,144,255,0.3)' : 'none',
          }}
        >
          {it.thumbnail ? (
            <img
              src={it.thumbnail}
              alt="thumbnail"
              style={{ width: '100%', height: 120, objectFit: 'cover', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (it.visualHref) {
                  window.open(it.visualHref, '_blank', 'noopener');
                } else {
                  const ev = new CustomEvent('open-item-details', { detail: { id: it.id } });
                  window.dispatchEvent(ev);
                }
              }}
            />
          ) : (
            <div style={{ width: '100%', height: 120, background: '#eee' }} />
          )}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>{it.collection || 'item'}</span>
              <span style={{ fontWeight: 400, fontSize: 12, color: '#666' }}>{it.cloudCover ?? '—'}% cc</span>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {it.datetime ? fmt.format(new Date(it.datetime)) : '—'}
            </div>
            <div style={{ fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.id}</div>
            <div style={{ marginTop: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const ev = new CustomEvent('open-item-details', { detail: { id: it.id } });
                  window.dispatchEvent(ev);
                }}
              >
                Details
              </button>
              {it.visualHref ? (
                <button
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(it.visualHref!, '_blank', 'noopener');
                  }}
                >
                  Open visual
                </button>
              ) : null}
            </div>
          </div>
        </button>
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
