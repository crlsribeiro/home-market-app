import { useState } from 'react';
import { ChevronDown, ChevronUp, Upload, Loader2, Receipt } from 'lucide-react';
import { Purchase, PurchaseItem } from '../types';
import { formatCurrency } from '../lib/utils';

interface Props { purchases: Purchase[]; purchaseItems: Record<string, PurchaseItem[]>; onFetchItems: (id: string) => Promise<void>; onUploadReceipt: (id: string, file: File) => Promise<void>; addToast: (msg: string, type?: 'success'|'error'|'info') => void; }

export function History({ purchases, purchaseItems, onFetchItems, onUploadReceipt, addToast }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const now = new Date();
  const monthTotal = purchases.filter(p => { const d = p.createdAt; return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, p) => s + (p.total || 0), 0);

  return (
    <div className="min-h-screen bg-[#F9F8F6] pb-24">
      <div className="bg-white border-b border-[#EBEBEB] px-5 pt-safe">
        <div className="py-4">
          <h1 className="text-xl font-bold">Histórico de compras</h1>
          {monthTotal > 0 && <p className="text-sm mt-0.5"><span className="font-bold" style={{ color: '#2D7A4F' }}>{formatCurrency(monthTotal)}</span><span className="text-[#6B6B6B]"> em {MONTHS[now.getMonth()]}</span></p>}
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        {purchases.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#EBEBEB] flex items-center justify-center mx-auto mb-4"><Receipt size={24} className="text-[#BDBDBD]" /></div>
            <p className="text-sm text-[#6B6B6B]">Nenhuma compra registrada ainda</p>
          </div>
        ) : purchases.map((p, i) => {
          const open = expandedId === p.id;
          const its = purchaseItems[p.id] || [];
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-[#EBEBEB] shadow-sm overflow-hidden">
              <button onClick={async () => { const next = open ? null : p.id; setExpandedId(next); if (next) await onFetchItems(p.id); }} className="w-full flex items-center justify-between p-4 text-left">
                <div>
                  <p className="font-semibold text-sm">SEMANA {p.weekLabel}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {p.total > 0 ? <p className="text-base font-bold" style={{ color: '#2D7A4F' }}>{formatCurrency(p.total)}</p> : <p className="text-xs text-[#6B6B6B] italic">Receipt pendente</p>}
                    {its.length > 0 && <p className="text-xs text-[#6B6B6B]">{its.length} itens</p>}
                  </div>
                </div>
                {open ? <ChevronUp size={18} className="text-[#6B6B6B]" /> : <ChevronDown size={18} className="text-[#6B6B6B]" />}
              </button>
              {open && (
                <div className="border-t border-[#EBEBEB] fade-in">
                  {i === 0 && !p.receiptProcessed && (
                    <div className="p-4 border-b border-[#EBEBEB]">
                      {uploadingId === p.id ? (
                        <div className="flex items-center gap-3 py-2"><Loader2 size={16} className="animate-spin text-[#2D7A4F]" /><p className="text-sm text-[#6B6B6B]">Processando...</p></div>
                      ) : (
                        <label className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-[#2D7A4F]/30 bg-[#E8F5EE] cursor-pointer w-full justify-center">
                          <Upload size={14} style={{ color: '#2D7A4F' }} /><span className="text-sm font-semibold" style={{ color: '#2D7A4F' }}>Adicionar receipt</span>
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setUploadingId(p.id); try { await onUploadReceipt(p.id, f); addToast('Receipt processado!'); } catch { addToast('Erro ao processar receipt', 'error'); } finally { setUploadingId(null); } }} />
                        </label>
                      )}
                    </div>
                  )}
                  {its.length > 0 ? (
                    <div className="divide-y divide-[#EBEBEB]">
                      {its.map(it => (
                        <div key={it.id} className="flex items-center justify-between px-4 py-3">
                          <div><p className="text-sm font-medium">{it.name}</p><p className="text-xs text-[#6B6B6B]">qtd {it.quantity} · {formatCurrency(it.unitPrice)}/un</p></div>
                          <p className="text-sm font-semibold" style={{ color: '#2D7A4F' }}>{formatCurrency(it.totalPrice)}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#F9F8F6]">
                        <p className="text-sm font-semibold">Total</p><p className="text-base font-bold" style={{ color: '#2D7A4F' }}>{formatCurrency(p.total)}</p>
                      </div>
                    </div>
                  ) : <div className="px-4 py-6 text-center"><p className="text-sm text-[#6B6B6B]">{p.receiptProcessed ? 'Nenhum item encontrado' : 'Adicione o receipt para ver os preços'}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
