import { useState, useRef, useEffect } from 'react';
import { X, ShoppingCart, Camera } from 'lucide-react';
import { ListStatus } from '../types';

interface Props {
  onClose: () => void;
  onAdd: (name: string, qty: number, notes: string, urgent: boolean, photoFile: File | null) => Promise<void>;
  listStatus: ListStatus;
}

export function AddItemSheet({ onClose, onAdd, listStatus }: Props) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const showUrgent = listStatus === 'locked' || listStatus === 'shopping';

  // Foca no input ao abrir
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handle = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAdd(name.trim(), qty, notes.trim(), urgent, photoFile);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      
      {/* 
        Usa padding-bottom dinâmico para subir acima do teclado no iPhone.
        env(keyboard-inset-height) é suportado em iOS Safari.
        O botão fica sempre visível pois está fora do scroll.
      */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 flex flex-col"
        style={{
          maxHeight: '90vh',
          paddingBottom: 'env(keyboard-inset-height, 0px)',
        }}
      >
        {/* Handle + Header — fixo */}
        <div className="flex-shrink-0">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b border-[#EBEBEB]">
            <h3 className="text-base font-semibold">Adicionar item</h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
              <X size={18} className="text-[#6B6B6B]" />
            </button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Nome — primeiro campo, foco imediato */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-1.5">
              Produto *
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Leite integral"
              className="w-full px-4 py-3 border border-[#EBEBEB] rounded-xl text-sm placeholder-[#BDBDBD] focus:outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all"
              onKeyDown={e => e.key === 'Enter' && handle()}
            />
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-1.5">
              Quantidade
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-[#EBEBEB] flex items-center justify-center text-lg font-medium hover:bg-gray-50"
              >–</button>
              <span className="text-lg font-semibold w-8 text-center">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-10 h-10 rounded-xl border border-[#EBEBEB] flex items-center justify-center text-lg font-medium hover:bg-gray-50"
              >+</button>
            </div>
          </div>

          {/* Extras colapsáveis — foto, observação, urgente */}
          <button
            onClick={() => setShowExtras(s => !s)}
            className="text-xs font-semibold text-[#2D7A4F] flex items-center gap-1"
          >
            {showExtras ? '▲ Menos opções' : '▼ Mais opções (foto, observação)'}
          </button>

          {showExtras && (
            <div className="space-y-4">

              {/* Foto */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-1.5">
                  Foto do produto (opcional)
                </label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-[#EBEBEB] flex flex-col items-center justify-center gap-2 hover:border-[#2D7A4F] hover:bg-[#F0F7F3] transition-all overflow-hidden"
                  style={photoPreview ? { padding: 0 } : {}}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Camera size={22} className="text-[#BDBDBD]" />
                      <span className="text-xs text-[#BDBDBD]">Toque para adicionar foto</span>
                    </>
                  )}
                </button>
                {photoPreview && (
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="mt-1 text-xs text-[#E05A3A]"
                  >
                    Remover foto
                  </button>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-1.5">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Marca preferida, tamanho..."
                  rows={2}
                  className="w-full px-4 py-3 border border-[#EBEBEB] rounded-xl text-sm placeholder-[#BDBDBD] focus:outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all resize-none"
                />
              </div>

              {/* Urgente */}
              {showUrgent && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FDEEE9] border border-[#E05A3A]/20">
                  <div>
                    <p className="text-sm font-semibold text-[#E05A3A]">Urgente?</p>
                    <p className="text-xs text-[#E05A3A]/70 mt-0.5">Admin será notificado</p>
                  </div>
                  <button
                    onClick={() => setUrgent(u => !u)}
                    className={`w-12 h-6 rounded-full transition-all relative ${urgent ? 'bg-[#E05A3A]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${urgent ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão FIXO no rodapé — sempre visível acima do teclado */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[#EBEBEB] bg-white">
          <button
            onClick={handle}
            disabled={!name.trim() || loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#2D7A4F' }}
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><ShoppingCart size={16} />Adicionar à lista</>
            }
          </button>
        </div>
      </div>
    </>
  );
}
