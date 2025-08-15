import React, { useEffect, useMemo, useState } from 'react';
import { useSearchStore } from '@/store/useSearchStore';

export default function ItemDetails() {
  const { selectedId, items, setPreviewOverlay } = useSearchStore((s) => ({
    selectedId: s.selectedId,
    items: s.items,
    setPreviewOverlay: s.setPreviewOverlay,
  }));
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = (e: any) => {
      setItemId(e?.detail?.id ?? null);
      setOpen(true);
    };
    window.addEventListener('open-item-details', onOpen);
    return () => window.removeEventListener('open-item-details', onOpen);
  }, []);

  const item = items.find((i) => i.id === (itemId || selectedId));
  const titiler = (import.meta as any).env?.VITE_TITILER_BASE as string | undefined;
  const tileUrl = useMemo(() => {
    if (!titiler || !item) return null;
    const base = String(titiler).replace(/\/$/, '');
    const coll = item.collection;
    if (!coll) return null;
    // Prefer visual asset; else try RGB bands
    const keys = new Set((item.assets || []).map((a) => a.key));
    let assets = '';
    if (keys.has('visual') || keys.has('rendered_preview')) {
      assets = keys.has('visual') ? 'visual' : 'rendered_preview';
    } else if (keys.has('B04') && keys.has('B03') && keys.has('B02')) {
      assets = 'B04,B03,B02';
    } else {
      return null;
    }
    const u = `${base}/stac/tiles/{z}/{x}/{y}?collection=${encodeURIComponent(
      coll
    )}&item=${encodeURIComponent(item.id)}&assets=${encodeURIComponent(assets)}`;
    return u;
  }, [titiler, item]);
  if (!open || !item) return null;

  return (
    <div style={{ border: '1px solid #eee', padding: 12, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Item Details</strong>
        <button onClick={() => setOpen(false)}>Close</button>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{item.id}</div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setPreviewOverlay(item.id, tileUrl || item.visualHref || pickFirstImageAsset(item.assets))} disabled={!tileUrl && !item.visualHref && !pickFirstImageAsset(item.assets)}>
          Preview on map
        </button>
        {item.visualHref ? (
          <button style={{ marginLeft: 8 }} onClick={() => window.open(item.visualHref!, '_blank')}>
            Open visual
          </button>
        ) : null}
      </div>
      <div style={{ marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th>Asset</th>
              <th>Type</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {item.assets?.map((a) => (
              <tr key={a.key}>
                <td>{a.key}</td>
                <td style={{ fontSize: 12, color: '#666' }}>{a.type || '—'}</td>
                <td>
                  <button onClick={() => window.open(a.href, '_blank')}>Open</button>
                  <button
                    style={{ marginLeft: 6 }}
                    onClick={() => navigator.clipboard.writeText(a.href)}
                  >
                    Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pickFirstImageAsset(assets?: { key: string; href: string; type?: string }[] | undefined) {
  if (!assets) return undefined;
  const img = assets.find((a) => (a.type || '').startsWith('image/'));
  return img?.href;
}
