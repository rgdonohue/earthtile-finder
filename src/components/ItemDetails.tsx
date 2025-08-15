import React, { useEffect, useState } from 'react';
import { useSearchStore } from '@/store/useSearchStore';

export default function ItemDetails() {
  const { selectedId, items } = useSearchStore((s) => ({
    selectedId: s.selectedId,
    items: s.items,
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {item.visualHref ? (
            <button
              className="rounded-lg border border-slate-700/50 px-3 py-2 text-sm text-gray-200 hover:border-transparent hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
              onClick={() => window.open(item.visualHref!, '_blank')}
            >
              Download
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
