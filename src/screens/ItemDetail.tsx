import { useState } from 'react';
import { ArrowLeft, Edit3, ShoppingCart } from 'lucide-react';
import { ListItem, WeekList } from '../types';
import { ItemStatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { formatCurrency, timeAgo } from '../lib/utils';

interface Props {
  item: ListItem;
  list: WeekList;
  unitPrice?: number | null;
  isAdmin: boolean;
  onBack: () => void;
  onMarkPurchased: () => Promise<void>;
  onRemove: () => Promise<void>;
  onUpdateNotes: (n: string) => Promise<void>;
}

export function ItemDetail({ item, list, unitPrice, isAdmin, onBack, onRemove, onUpdateNotes }: Props) {
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
      <div className="min-h-screen bg-[#F9F8F6] pb-safe">

        {/* Header */}
        <div className="bg-white border-b border-[#EBEBEB] px-5 pt-safe">
          <p className="text-center text-sm font-semibold text-[#2D7A4F] pt-3">Home Market</p>
          <div className="flex items-center justify-between py-3">
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
            <ItemStatusBadge status={item.status} approvalStatus={item.approvalStatus} />
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">

          {/* Card principal */}
          <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">

            {/* Foto ajustada sem cortes */}
            <div className="w-full max-h-72 min-h-48 bg-gray-50 flex items-center justify-center border-b border-[#EBEBEB]">
              {item.photoURL ? (
                  <img
                      src={item.photoURL}
                      alt={item.name}
                      className="w-full h-auto max-h-72 object-contain"
                  />
              ) : (
                  <div className="w-full h-48 flex flex-col items-center justify-center" style={{ backgroundColor: '#F0F7F3' }}>
                    <ShoppingCart size={36} style={{ color: '#2D7A4F', opacity: 0.35 }} />
                  </div>
              )}
            </div>

            <div className="divide-y divide-[#EBEBEB]">

              {/* Nome e descrição */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h1 className="text-lg font-bold leading-tight">{item.name}</h1>
                    {!editNotes && (
                        <p className="text-sm mt-0.5" style={{ color: notes ? '#6B6B6B' : '#BDBDBD' }}>
                          {notes || 'Sem descrição'}
                        </p>
                    )}
                  </div>
                  {item.urgent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDEEE9] text-[#E05A3A] flex-shrink-0">
                    URGENTE
                  </span>
                  )}
                </div>

                {/* Editar descrição */}
                {editNotes ? (
                    <div className="mt-3">
                  <textarea
                      autoFocus
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      className="w-full text-sm border border-[#EBEBEB] rounded-xl px-3 py-2 focus:outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 resize-none"
                      placeholder="Adicione uma descrição..."
                  />
                      <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => { setEditNotes(false); setNotes(item.notes || ''); }}
                            className="flex-1 py-2 rounded-xl border border-[#EBEBEB] text-sm font-medium text-[#6B6B6B]"
                        >
                          Cancelar
                        </button>
                        <button
                            onClick={async () => {
                              setSaving(true);
                              try { await onUpdateNotes(notes); setEditNotes(false); }
                              finally { setSaving(false); }
                            }}
                            disabled={saving}
                            className="flex-1 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                            style={{ backgroundColor: '#2D7A4F' }}
                        >
                          {saving ? '...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setEditNotes(true)}
                        className="mt-2 flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#2D7A4F]"
                    >
                      <Edit3 size={11} />
                      Editar descrição
                    </button>
                )}
              </div>

              {/* Quantidade */}
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-[#6B6B6B]">Quantidade</p>
                <p className="text-sm font-semibold">{item.quantity}</p>
              </div>

              {/* Solicitado por */}
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-[#6B6B6B]">Solicitado por</p>
                <div className="flex items-center gap-2">
                  <Avatar name={item.addedByName} size="sm" />
                  <p className="text-sm font-medium">{item.addedByName}</p>
                </div>
              </div>

              {/* Adicionado */}
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-[#6B6B6B]">Adicionado</p>
                <p className="text-sm font-medium">{timeAgo(item.createdAt)}</p>
              </div>

              {/* Semana */}
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-[#6B6B6B]">Semana</p>
                <p className="text-sm font-medium">SEMANA {list.weekLabel}</p>
              </div>

              {/* Preço — só admin */}
              {isAdmin && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-1">Preço</p>
                    {unitPrice != null ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-[#6B6B6B]">{formatCurrency(unitPrice)} por unidade</p>
                          <p className="text-base font-bold" style={{ color: '#2D7A4F' }}>
                            {formatCurrency(unitPrice * item.quantity)}
                          </p>
                        </div>
                    ) : (
                        <p className="text-sm italic" style={{ color: '#BDBDBD' }}>Disponível após upload do receipt</p>
                    )}
                  </div>
              )}
            </div>
          </div>

          {/* Só remover — marcar como comprado acontece no modo mercado */}
          {list.status !== 'closed' && (
              <button
                  onClick={async () => { if (!confirming) { setConfirming(true); return; } await onRemove(); }}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${confirming ? 'bg-[#E05A3A] text-white' : 'text-[#E05A3A]'}`}
              >
                {confirming ? 'Confirmar remoção' : 'Remover da lista'}
              </button>
          )}
        </div>
      </div>
  );
}