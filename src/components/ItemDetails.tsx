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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="relative w-[92vw] max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-800/70 backdrop-blur-sm p-4 sm:p-6 text-sm text-gray-300 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide text-white">Item Details</h2>
          <button
            className="rounded-lg border border-slate-700/50 px-3 py-1 text-sm hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1 truncate">{item.id}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setPreviewOverlay(item.id, tileUrl || item.visualHref || pickFirstImageAsset(item.assets))}
            disabled={!tileUrl && !item.visualHref && !pickFirstImageAsset(item.assets)}
            className="rounded-lg border border-slate-700/50 px-3 py-2 text-sm text-gray-200 hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 disabled:opacity-50"
          >
            Preview on map
          </button>
          {item.visualHref ? (
            <button
              className="rounded-lg border border-slate-700/50 px-3 py-2 text-sm text-gray-200 hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
              onClick={() => window.open(item.visualHref!, '_blank')}
            >
              Open visual
            </button>
          ) : null}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400">
                <th className="py-1">Asset</th>
                <th className="py-1">Type</th>
                <th className="py-1">Link</th>
              </tr>
            </thead>
            <tbody>
              {item.assets?.map((a) => (
                <tr key={a.key} className="border-t border-slate-700/40">
                  <td className="py-2 text-gray-200">{a.key}</td>
                  <td className="py-2 text-xs text-gray-400">{a.type || '—'}</td>
                  <td className="py-2">
                    <button
                      className="rounded-lg border border-slate-700/50 px-2 py-1 text-xs text-gray-200 hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
                      onClick={() => window.open(a.href, '_blank')}
                    >
                      Open
                    </button>
                    <button
                      className="ml-2 rounded-lg border border-slate-700/50 px-2 py-1 text-xs text-gray-200 hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
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
    </div>
  );
}

function pickFirstImageAsset(assets?: { key: string; href: string; type?: string }[] | undefined) {
  if (!assets) return undefined;
  const img = assets.find((a) => (a.type || '').startsWith('image/'));
  return img?.href;
}
