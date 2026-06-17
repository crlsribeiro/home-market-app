import { useState } from 'react';
import { Bell, Plus, ChevronDown, ChevronUp, AlertTriangle, LogOut } from 'lucide-react';
import { WeekList, ListItem, AppUser } from '../types';
import { StatusBadge, ItemStatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { AddItemSheet } from '../components/AddItemSheet';

interface Props {
  appUser: AppUser; currentList: WeekList | null; items: ListItem[]; nextWeekItems: ListItem[];
  onCreateList: () => Promise<void>;
  onAddItem: (name: string, qty: number, notes: string, urgent: boolean, photoFile: File | null) => Promise<void>;
  onToggleItem: (id: string, status: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>; onReject: (id: string) => Promise<void>;
  onItemTap: (item: ListItem) => void; onAdminCut: () => void;
  pendingApprovals: ListItem[]; onNotFoundBannerTap: () => void;
  onLogout: () => Promise<void>;
}

export function MainList({ appUser, currentList, items, nextWeekItems, onCreateList, onAddItem, onToggleItem, onApprove, onReject, onItemTap, onAdminCut, pendingApprovals, onNotFoundBannerTap, onLogout }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isAdmin = appUser.role === 'admin';
  const purchased = items.filter(i => i.status === 'purchased');
  const pending = items.filter(i => i.status === 'pending' && i.approvalStatus !== 'pending');
  const urgent = items.filter(i => i.urgent && i.status !== 'purchased');
  const myNotFound = items.filter(i => i.status === 'not_found' && i.addedByUid === appUser.uid && !i.notFoundResolved);

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F8F6] pb-24">
      <div className="sticky top-0 bg-white border-b border-[#EBEBEB] z-30 px-5 pt-safe">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Avatar name={appUser.displayName} photoURL={appUser.photoURL} />
            <div>
              <p className="text-xs text-[#6B6B6B]">Olá,</p>
              <p className="text-sm font-semibold leading-tight">{appUser.displayName.split(' ')[0]} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentList && <StatusBadge status={currentList.status} />}
            <button className="relative p-2 rounded-full hover:bg-gray-100">
              <Bell size={20} className="text-[#6B6B6B]" />
              {pendingApprovals.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E05A3A] text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
            <button onClick={() => setShowLogoutModal(true)} className="p-2 rounded-full hover:bg-gray-100">
              <LogOut size={20} className="text-[#6B6B6B]" />
            </button>
          </div>
        </div>
        {currentList && (
          <p className="text-xs font-semibold text-[#6B6B6B] tracking-wider uppercase pb-3">
            SEMANA {currentList.weekLabel}
          </p>
        )}
      </div>

      {myNotFound.length > 0 && (
        <button onClick={onNotFoundBannerTap} className="mx-4 mt-4 flex items-center gap-3 p-3.5 rounded-xl border border-[#F0A500]/30 bg-[#FFF8E1] text-left">
          <AlertTriangle size={16} style={{ color: '#F0A500' }} />
          <p className="text-xs font-semibold text-[#C47F00] flex-1">{myNotFound.length} produto(s) não encontrado(s) — responda agora</p>
          <ChevronDown size={14} style={{ color: '#F0A500' }} />
        </button>
      )}

      {!currentList ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E8F5EE' }}>
            <Plus size={28} style={{ color: '#2D7A4F' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold mb-1">Nenhuma lista ativa</p>
            <p className="text-sm text-[#6B6B6B]">{isAdmin ? 'Crie uma lista para começar a semana' : 'Aguarde o admin criar a lista'}</p>
          </div>
          {isAdmin && (
            <div className="flex flex-col items-center gap-3">
              {createError && <p className="text-red-500 text-xs">{createError}</p>}
              <button
                onClick={async () => {
                  setCreateError(null);
                  setCreating(true);
                  try { await onCreateList(); }
                  catch { setCreateError('Erro ao criar lista. Tente novamente.'); }
                  finally { setCreating(false); }
                }}
                disabled={creating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
                style={{ backgroundColor: '#2D7A4F' }}
              >
                {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                Nova lista da semana
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">

          {/* Cards de resumo */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            <SummaryCard label="Total"     value={items.length}     color="#1A1A1A" bg="#FFFFFF" />
            <SummaryCard label="Comprados" value={purchased.length} color="#2D7A4F" bg="#E8F5EE" />
            <SummaryCard label="Pendentes" value={pending.length}   color="#C47F00" bg="#FFF8E1" />
            {urgent.length > 0 && <SummaryCard label="Urgentes" value={urgent.length} color="#E05A3A" bg="#FDEEE9" />}
          </div>

          {/* Aprovações pendentes — só admin */}
          {isAdmin && pendingApprovals.length > 0 && (
            <div className="space-y-2">
              {pendingApprovals.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border-l-4 border-[#E05A3A] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">Solicitado por {item.addedByName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onReject(item.id)} className="px-3 py-1.5 rounded-lg border border-[#E05A3A]/30 text-xs font-semibold text-[#E05A3A] hover:bg-[#FDEEE9]">Recusar</button>
                      <button onClick={() => onApprove(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2D7A4F' }}>Aprovar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lista da semana */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Lista desta semana</p>
              {isAdmin && (
                <button onClick={onAdminCut} className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#E05A3A' }}>
                  FAZER CORTE
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#EBEBEB]">
                <p className="text-[#6B6B6B] text-sm">A lista está vazia. Adicione itens!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onItemTap(item)}
                    className="bg-white rounded-2xl p-4 border border-[#EBEBEB] shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    {/* Thumbnail da foto */}
                    {item.photoURL ? (
                      <img
                        src={item.photoURL}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-[#EBEBEB]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F0F7F3' }}>
                        <span className="text-lg">{item.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        {item.urgent && item.status !== 'purchased' && (
                          <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FDEEE9] text-[#E05A3A]">URGENTE</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">qtd {item.quantity} · {item.addedByName}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <ItemStatusBadge status={item.status} approvalStatus={item.approvalStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próxima semana */}
          {nextWeekItems.length > 0 && (
            <div>
              <button onClick={() => setShowNext(s => !s)} className="flex items-center gap-2 w-full text-left mb-3">
                <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider flex-1">
                  Próxima semana ({nextWeekItems.length} itens)
                </p>
                {showNext ? <ChevronUp size={16} className="text-[#6B6B6B]" /> : <ChevronDown size={16} className="text-[#6B6B6B]" />}
              </button>
              {showNext && (
                <div className="space-y-2 fade-in">
                  {nextWeekItems.map(item => (
                    <div
                    key={item.id}
                    onClick={() => onItemTap(item)}
                    className="bg-white rounded-2xl p-4 border border-[#EBEBEB] opacity-55 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    {item.photoURL ? (
                      <img src={item.photoURL} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-[#EBEBEB]" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F0F7F3' }}>
                        <span className="text-lg">{item.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-[#6B6B6B]">qtd {item.quantity} · {item.addedByName}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-[#6B6B6B]">PRÓX. SEMANA</span>
                  </div>
                   ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      {currentList && currentList.status !== 'closed' && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 hover:scale-105 z-30"
          style={{ backgroundColor: '#2D7A4F' }}
        >
          <Plus size={26} color="white" strokeWidth={2.5} />
        </button>
      )}

      {showAdd && currentList && (
        <AddItemSheet onClose={() => setShowAdd(false)} onAdd={onAddItem} listStatus={currentList.status} />
      )}

      {/* Modal de logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Deseja sair?</h3>
            <p className="text-sm text-[#6B6B6B] mb-5">Você será desconectado da sua conta.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 rounded-xl border border-[#EBEBEB] text-sm font-semibold text-[#6B6B6B] hover:bg-gray-50">Cancelar</button>
              <button
                onClick={async () => { setLoggingOut(true); try { await onLogout(); } catch { setLoggingOut(false); setShowLogoutModal(false); } }}
                disabled={loggingOut}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold bg-[#E05A3A] disabled:opacity-60"
              >
                {loggingOut ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Sair'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="flex-shrink-0 flex flex-col items-center justify-center px-5 py-3 rounded-2xl border border-[#EBEBEB] min-w-[80px]" style={{ backgroundColor: bg }}>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-[#6B6B6B] mt-0.5 font-medium whitespace-nowrap">{label}</p>
    </div>
  );
}