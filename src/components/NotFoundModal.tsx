import { useState } from 'react';
import { X } from 'lucide-react';
import { ListItem } from '../types';

interface Props { items: ListItem[]; onKeep: (id: string) => Promise<void>; onDiscard: (id: string) => Promise<void>; onClose: () => void; }

export function NotFoundModal({ items, onKeep, onDiscard, onClose }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const act = async (id: string, fn: () => Promise<void>) => { setLoadingId(id); try { await fn(); } finally { setLoadingId(null); } };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 slide-up pb-safe">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#EBEBEB]">
          <div><h3 className="text-base font-semibold">Produtos não encontrados</h3><p className="text-xs text-[#6B6B6B] mt-0.5">O que fazer com estes itens?</p></div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={18} className="text-[#6B6B6B]" /></button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="bg-[#F9F8F6] rounded-2xl p-4">
              <p className="font-semibold text-sm mb-1">{item.name}</p>
              <p className="text-xs text-[#6B6B6B] mb-3">qtd {item.quantity}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => act(item.id, () => onDiscard(item.id))} disabled={loadingId === item.id} className="py-2.5 rounded-xl border border-[#E05A3A]/30 text-xs font-semibold text-[#E05A3A] bg-white disabled:opacity-60">Descartar</button>
                <button onClick={() => act(item.id, () => onKeep(item.id))} disabled={loadingId === item.id} className="py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#2D7A4F' }}>
                  {loadingId === item.id ? '...' : 'Guardar p/ próx. semana'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
