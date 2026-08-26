import { useState } from 'react';
import { ChevronDown, ChevronUp, Upload, Loader2, Receipt, Edit2, Check, X } from 'lucide-react';
import { Purchase, PurchaseItem } from '../types';
import { formatCurrency } from '../lib/utils';

interface Props {
    purchases: Purchase[];
    purchaseItems: Record<string, PurchaseItem[]>;
    onFetchItems: (id: string) => Promise<void>;
    onUploadReceipt: (id: string, file: File) => Promise<void>;
    onUpdateItemPrice?: (purchaseId: string, itemId: string, newUnitPrice: number, newName?: string) => Promise<void>;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function History({ purchases, purchaseItems, onFetchItems, onUploadReceipt, onUpdateItemPrice, addToast }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<string>('');
    const [editName, setEditName] = useState<string>('');
    const [savingItem, setSavingItem] = useState(false);

    const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const now = new Date();
    const monthTotal = purchases
        .filter(p => {
            const d = p.createdAt;
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, p) => s + (p.total || 0), 0);

    const handleStartEdit = (it: PurchaseItem) => {
        setEditingItemId(it.id);
        setEditPrice(it.unitPrice ? String(it.unitPrice) : '');
        setEditName(it.name);
    };

    const handleSaveEdit = async (purchaseId: string, itemId: string) => {
        const priceNum = parseFloat(editPrice.replace(',', '.'));
        if (isNaN(priceNum) || priceNum < 0) {
            addToast('Digite um preço válido', 'error');
            return;
        }

        if (!onUpdateItemPrice) {
            addToast('Função de atualização não configurada', 'error');
            return;
        }

        setSavingItem(true);
        try {
            await onUpdateItemPrice(purchaseId, itemId, priceNum, editName);
            addToast('Preço atualizado!');
            setEditingItemId(null);
            await onFetchItems(purchaseId);
        } catch {
            addToast('Erro ao atualizar preço', 'error');
        } finally {
            setSavingItem(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F8F6] pb-24">
            {/* Header */}
            <div className="bg-white border-b border-[#EBEBEB] px-5 pt-safe">
                <div className="py-4">
                    <h1 className="text-xl font-bold">Histórico de compras</h1>
                    {monthTotal > 0 && (
                        <p className="text-sm mt-0.5">
                            <span className="font-bold" style={{ color: '#2D7A4F' }}>{formatCurrency(monthTotal)}</span>
                            <span className="text-[#6B6B6B]"> em {MONTHS[now.getMonth()]}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="px-4 py-4 space-y-3">
                {purchases.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-[#EBEBEB] flex items-center justify-center mx-auto mb-4">
                            <Receipt size={24} className="text-[#BDBDBD]" />
                        </div>
                        <p className="text-sm text-[#6B6B6B]">Nenhuma compra registrada ainda</p>
                    </div>
                ) : (
                    purchases.map((p, i) => {
                        const open = expandedId === p.id;
                        const its = purchaseItems[p.id] || [];

                        return (
                            <div key={p.id} className="bg-white rounded-2xl border border-[#EBEBEB] shadow-sm overflow-hidden">
                                <button
                                    onClick={async () => {
                                        const next = open ? null : p.id;
                                        setExpandedId(next);
                                        if (next) await onFetchItems(p.id);
                                    }}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <div>
                                        <p className="font-semibold text-sm">SEMANA {p.weekLabel}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {p.total > 0 ? (
                                                <p className="text-base font-bold" style={{ color: '#2D7A4F' }}>{formatCurrency(p.total)}</p>
                                            ) : (
                                                <p className="text-xs text-[#6B6B6B] italic">Receipt pendente</p>
                                            )}
                                            {its.length > 0 && <p className="text-xs text-[#6B6B6B]">{its.length} itens</p>}
                                        </div>
                                    </div>
                                    {open ? <ChevronUp size={18} className="text-[#6B6B6B]" /> : <ChevronDown size={18} className="text-[#6B6B6B]" />}
                                </button>

                                {open && (
                                    <div className="border-t border-[#EBEBEB] fade-in">
                                        {/* Botão para upload/reenvio de receipt */}
                                        {i === 0 && (
                                            <div className="p-4 border-b border-[#EBEBEB]">
                                                {uploadingId === p.id ? (
                                                    <div className="flex items-center gap-3 py-2">
                                                        <Loader2 size={16} className="animate-spin text-[#2D7A4F]" />
                                                        <p className="text-sm text-[#6B6B6B]">Processando receipt...</p>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-[#2D7A4F]/30 bg-[#E8F5EE] cursor-pointer w-full justify-center">
                                                        <Upload size={14} style={{ color: '#2D7A4F' }} />
                                                        <span className="text-sm font-semibold" style={{ color: '#2D7A4F' }}>
                              {p.receiptProcessed ? 'Reenviar receipt / foto limpa' : 'Adicionar receipt'}
                            </span>
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            className="hidden"
                                                            onChange={async e => {
                                                                const f = e.target.files?.[0];
                                                                if (!f) return;
                                                                setUploadingId(p.id);
                                                                try {
                                                                    await onUploadReceipt(p.id, f);
                                                                    addToast('Receipt processado!');
                                                                    await onFetchItems(p.id);
                                                                } catch {
                                                                    addToast('Erro ao processar receipt', 'error');
                                                                } finally {
                                                                    setUploadingId(null);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        {/* Lista de Itens */}
                                        {its.length > 0 ? (
                                            <div className="divide-y divide-[#EBEBEB]">
                                                {its.map(it => {
                                                    const isEditing = editingItemId === it.id;

                                                    return (
                                                        <div key={it.id} className="px-4 py-3">
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <input
                                                                        type="text"
                                                                        value={editName}
                                                                        onChange={e => setEditName(e.target.value)}
                                                                        placeholder="Nome do produto"
                                                                        className="w-full text-sm border border-[#EBEBEB] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#2D7A4F]"
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-semibold">$</span>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={editPrice}
                                                                            onChange={e => setEditPrice(e.target.value)}
                                                                            placeholder="0.00"
                                                                            className="flex-1 text-sm border border-[#EBEBEB] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#2D7A4F]"
                                                                        />
                                                                        <button
                                                                            disabled={savingItem}
                                                                            onClick={() => handleSaveEdit(p.id, it.id)}
                                                                            className="p-2 bg-[#2D7A4F] text-white rounded-lg disabled:opacity-50"
                                                                        >
                                                                            {savingItem ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingItemId(null)}
                                                                            className="p-2 border border-[#EBEBEB] text-[#6B6B6B] rounded-lg"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1 pr-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <p className="text-sm font-medium">{it.name}</p>
                                                                            <button
                                                                                onClick={() => handleStartEdit(it)}
                                                                                className="text-[#BDBDBD] hover:text-[#2D7A4F] p-0.5"
                                                                                title="Editar valor manualmente"
                                                                            >
                                                                                <Edit2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-xs text-[#6B6B6B]">
                                                                            qtd {it.quantity} · {formatCurrency(it.unitPrice)}/un
                                                                        </p>
                                                                    </div>
                                                                    <p className="text-sm font-semibold" style={{ color: it.totalPrice > 0 ? '#2D7A4F' : '#E05A3A' }}>
                                                                        {formatCurrency(it.totalPrice)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Linha do Total */}
                                                <div className="flex items-center justify-between px-4 py-3 bg-[#F9F8F6]">
                                                    <p className="text-sm font-semibold">Total</p>
                                                    <p className="text-base font-bold" style={{ color: '#2D7A4F' }}>
                                                        {formatCurrency(p.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="px-4 py-6 text-center">
                                                <p className="text-sm text-[#6B6B6B]">
                                                    {p.receiptProcessed ? 'Nenhum item encontrado' : 'Adicione o receipt para ver os preços'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}