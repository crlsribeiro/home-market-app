import { ListStatus } from '../types';

const STATUS: Record<ListStatus, { label: string; color: string; bg: string }> = {
  open:     { label: 'ABERTA',     color: '#2D7A4F', bg: '#E8F5EE' },
  locked:   { label: 'TRAVADA',    color: '#C47F00', bg: '#FFF8E1' },
  shopping: { label: 'NO MERCADO', color: '#E05A3A', bg: '#FDEEE9' },
  closed:   { label: 'FECHADA',    color: '#6B6B6B', bg: '#F0F0F0' },
};

export function StatusBadge({ status }: { status: ListStatus }) {
  const c = STATUS[status];
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide" style={{ color: c.color, backgroundColor: c.bg }}>{c.label}</span>;
}

export function ItemStatusBadge({ status, approvalStatus }: { status: string; approvalStatus: string }) {
  if (approvalStatus === 'pending') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: '#C47F00', backgroundColor: '#FFF8E1' }}>AGUARD. APROVAÇÃO</span>;
  if (status === 'purchased')       return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: '#2D7A4F', backgroundColor: '#E8F5EE' }}>COMPRADO</span>;
  if (status === 'not_found')       return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: '#E05A3A', backgroundColor: '#FDEEE9' }}>NÃO ENCONTRADO</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: '#C47F00', backgroundColor: '#FFF8E1' }}>PENDENTE</span>;
}
