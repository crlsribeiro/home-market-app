import { useState } from 'react';
import { Check, Link, Copy, Lock, ShoppingCart, AlertTriangle } from 'lucide-react';
import { WeekList, ListItem, AppUser, Household } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { timeAgo } from '../lib/utils';

interface Props {
  household: Household; members: AppUser[]; currentList: WeekList | null;
  pendingApprovals: ListItem[]; items: ListItem[];
  onApprove: (id: string) => Promise<void>; onReject: (id: string) => Promise<void>;
  onLockList: () => Promise<void>; onStartShopping: () => Promise<void>; onWeeklyCut: () => Promise<void>;
  onGenerateInvite: () => Promise<string>; addToast: (msg: string, type?: 'success'|'error'|'info') => void;
}

export function AdminPanel({ household, members, currentList, pendingApprovals, items, onApprove, onReject, onLockList, onStartShopping, onWeeklyCut, onGenerateInvite, addToast }: Props) {
  const [showCutModal, setShowCutModal] = useState(false);
  const [cutting, setCutting] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);
  const [starting, setStarting] = useState(false);
  const pendingItems = items.filter(i => i.status === 'pending' && i.approvalStatus !== 'pending');
  const purchasedItems = items.filter(i => i.status === 'purchased');

  return (
    <div className="min-h-screen bg-[#F9F8F6] pb-24">
      <div className="bg-white border-b border-[#EBEBEB] px-5 pt-safe">
        <div className="py-4"><h1 className="text-xl font-bold">Painel Admin</h1><p className="text-xs text-[#6B6B6B] mt-0.5">{household.name}</p></div>
      </div>
      <div className="px-4 py-4 space-y-5">
        {currentList && (
          <Section title="Status da Lista">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">SEMANA {currentList.weekLabel}</p>
              <StatusBadge status={currentList.status} />
            </div>
            {currentList.status === 'open' && (
              <button onClick={async () => { setLocking(true); try { await onLockList(); } finally { setLocking(false); } }} disabled={locking} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#F0A500]/40 bg-[#FFF8E1] text-[#C47F00] text-xs font-semibold disabled:opacity-60">
                {locking ? <Spin c="#C47F00" /> : <Lock size={14} />}Travar Lista
              </button>
            )}
            {currentList.status === 'locked' && (
              <button onClick={async () => { setStarting(true); try { await onStartShopping(); } finally { setStarting(false); } }} disabled={starting} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E05A3A]/30 bg-[#FDEEE9] text-[#E05A3A] text-xs font-semibold disabled:opacity-60">
                {starting ? <Spin c="#E05A3A" /> : <ShoppingCart size={14} />}Ir às Compras
              </button>
            )}
          </Section>
        )}

        <Section title="Aprovações">
          {pendingApprovals.length === 0 ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-full bg-[#E8F5EE] flex items-center justify-center"><Check size={16} style={{ color: '#2D7A4F' }} /></div>
              <p className="text-sm text-[#6B6B6B]">Nenhuma aprovação pendente ✓</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{item.name}</p><p className="text-xs text-[#6B6B6B] mt-0.5">{item.addedByName} · {timeAgo(item.createdAt)}</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => onReject(item.id)} className="px-3 py-1.5 rounded-lg border border-[#E05A3A]/30 text-xs font-semibold text-[#E05A3A]">Recusar</button>
                    <button onClick={() => onApprove(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#2D7A4F' }}>Aprovar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {currentList && (
          <Section title="Corte Semanal">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Metric label="Comprados" value={purchasedItems.length} color="#2D7A4F" />
              <Metric label="Pendentes" value={pendingItems.length} color="#C47F00" />
            </div>
            <button onClick={() => setShowCutModal(true)} className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2" style={{ backgroundColor: '#E05A3A' }}>
              <AlertTriangle size={14} />Fazer Corte Semanal
            </button>
          </Section>
        )}

        <Section title="Membros">
          {members.length === 1 && <div className="mb-3 p-3 rounded-xl bg-[#FFF8E1] border border-[#F0A500]/20"><p className="text-xs text-[#C47F00] font-medium">Você está sozinho. Convide alguém para colaborar!</p></div>}
          <div className="space-y-3 mb-4">
            {members.map(m => (
              <div key={m.uid} className="flex items-center gap-3">
                <Avatar name={m.displayName} photoURL={m.photoURL} />
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{m.displayName}</p><p className="text-xs text-[#6B6B6B] truncate">{m.email}</p></div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={m.role === 'admin' ? { backgroundColor: '#E8F5EE', color: '#2D7A4F' } : { backgroundColor: '#F0F0F0', color: '#6B6B6B' }}>{m.role === 'admin' ? 'Admin' : 'Membro'}</span>
              </div>
            ))}
          </div>
          <button onClick={async () => { setGeneratingInvite(true); try { const t = await onGenerateInvite(); setInviteToken(t); } finally { setGeneratingInvite(false); } }} disabled={generatingInvite} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#2D7A4F]/30 text-sm font-semibold" style={{ color: '#2D7A4F' }}>
            {generatingInvite ? <Spin c="#2D7A4F" /> : <Link size={14} />}Gerar código de convite
          </button>
          {inviteToken && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-[#E8F5EE] border border-[#2D7A4F]/20">
              <code className="text-sm font-mono font-bold text-[#2D7A4F] flex-1 tracking-widest">{inviteToken}</code>
              <button onClick={() => { navigator.clipboard.writeText(inviteToken); addToast('Código copiado!'); }} className="p-1.5 rounded-lg hover:bg-[#2D7A4F]/10"><Copy size={14} style={{ color: '#2D7A4F' }} /></button>
            </div>
          )}
        </Section>
      </div>

      {showCutModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowCutModal(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 p-6 slide-up pb-safe">
            <h3 className="text-lg font-bold mb-2">Confirmar corte semanal?</h3>
            <p className="text-sm text-[#6B6B6B] mb-5"><strong>{pendingItems.length}</strong> {pendingItems.length === 1 ? 'item pendente será movido' : 'itens pendentes serão movidos'} para a próxima semana.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCutModal(false)} className="flex-1 py-3 rounded-xl border border-[#EBEBEB] text-sm font-semibold text-[#6B6B6B]">Cancelar</button>
              <button onClick={async () => { setCutting(true); try { await onWeeklyCut(); setShowCutModal(false); addToast('Corte semanal realizado!'); } finally { setCutting(false); } }} disabled={cutting} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center" style={{ backgroundColor: '#E05A3A' }}>
                {cutting ? <Spin c="white" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-sm p-4"><p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">{title}</p>{children}</div>;
}
function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="flex flex-col items-center py-3 rounded-xl bg-[#F9F8F6]"><p className="text-2xl font-bold" style={{ color }}>{value}</p><p className="text-xs text-[#6B6B6B] mt-0.5">{label}</p></div>;
}
function Spin({ c }: { c: string }) {
  return <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${c}30`, borderTopColor: c }} />;
}
