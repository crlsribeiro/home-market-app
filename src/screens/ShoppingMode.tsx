import { useState } from 'react';
import { ShoppingCart, Check, X } from 'lucide-react';
import { WeekList, ListItem } from '../types';

interface Props { list: WeekList; items: ListItem[]; isAdmin: boolean; onPicked: (id: string) => Promise<void>; onNotFound: (id: string) => Promise<void>; onCloseList: () => Promise<void>; }

export function ShoppingMode({ list, items, isAdmin, onPicked, onNotFound, onCloseList }: Props) {
  const [closing, setClosing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const active = items.filter(i => i.status === 'pending' && i.approvalStatus !== 'pending');
  const picked = items.filter(i => i.status === 'purchased');
  const notFound = items.filter(i => i.status === 'not_found');
  const act = async (id: string, fn: () => Promise<void>) => { setLoadingId(id); try { await fn(); } finally { setLoadingId(null); } };

  return (
    <div className="min-h-screen bg-[#F9F8F6] pb-safe">
      <div className="bg-white border-b border-[#EBEBEB] px-5 pt-safe pb-4">
        <div className="flex items-center gap-3 pt-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2D7A4F' }}><ShoppingCart size={20} color="white" /></div>
          <div><h1 className="text-xl font-bold">Modo Mercado 🛒</h1><p className="text-xs text-[#6B6B6B]">SEMANA {list.weekLabel}</p></div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1.5">
            <span>{picked.length} de {items.length} itens</span>
            <span className="font-semibold" style={{ color: '#2D7A4F' }}>{items.length > 0 ? Math.round(picked.length / items.length * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-[#EBEBEB] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: '#2D7A4F', width: `${items.length > 0 ? picked.length / items.length * 100 : 0}%` }} />
          </div>
        </div>
      </div>
      <div className="px-4 pt-4 space-y-3">
        {active.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB] shadow-sm">
            <div className="mb-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg font-bold leading-tight">{item.name}</p>
                {item.urgent && <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDEEE9] text-[#E05A3A]">URGENTE</span>}
              </div>
              <p className="text-sm text-[#6B6B6B] mt-0.5">qtd {item.quantity} · {item.addedByName}</p>
              {item.notes && <p className="text-xs text-[#6B6B6B] mt-1 italic">{item.notes}</p>}
            </div>
            {loadingId === item.id ? (
              <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-[#EBEBEB] border-t-[#2D7A4F] rounded-full animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => act(item.id, () => onPicked(item.id))} className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all" style={{ backgroundColor: '#2D7A4F' }}><Check size={16} strokeWidth={2.5} />PEGUEI</button>
                <button onClick={() => act(item.id, () => onNotFound(item.id))} className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm active:scale-95 transition-all" style={{ backgroundColor: '#E05A3A' }}><X size={16} strokeWidth={2.5} />NÃO TEM</button>
              </div>
            )}
          </div>
        ))}
        {notFound.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#E05A3A]/20 opacity-75">
            <p className="font-semibold text-sm mb-1">{item.name}</p>
            <p className="text-xs text-[#6B6B6B]">qtd {item.quantity} · {item.addedByName}</p>
            <div className="mt-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#E05A3A]" /><p className="text-xs font-medium text-[#E05A3A]">notificação enviada</p></div>
          </div>
        ))}
        {picked.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#4CAF7D]/20 opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5EE' }}><Check size={16} style={{ color: '#4CAF7D' }} /></div>
              <div><p className="font-semibold text-sm line-through">{item.name}</p><p className="text-xs text-[#6B6B6B]">qtd {item.quantity}</p></div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-12"><p className="text-[#6B6B6B] text-sm">Nenhum item na lista</p></div>}
        {isAdmin && (
          <div className="pt-4 pb-8">
            <button onClick={async () => { setClosing(true); try { await onCloseList(); } finally { setClosing(false); } }} disabled={closing} className="w-full py-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#E05A3A' }}>
              {closing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Fechar Lista'}
            </button>
            <p className="text-xs text-[#6B6B6B] text-center mt-2">Itens pendentes serão movidos para próxima semana</p>
          </div>
        )}
      </div>
    </div>
  );
}
