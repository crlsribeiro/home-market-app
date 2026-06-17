import { useState } from 'react';
import { Home, Users, ArrowRight, Loader2, ShoppingCart } from 'lucide-react';

type Mode = null | 'create' | 'join';

export function Onboarding({ onCreateFamily, onJoinFamily }: { onCreateFamily: (name: string) => Promise<void>; onJoinFamily: (token: string) => Promise<void> }) {
  const [mode, setMode] = useState<Mode>(null);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!value.trim()) return;
    setError(''); setLoading(true);
    try { mode === 'create' ? await onCreateFamily(value.trim()) : await onJoinFamily(value.trim()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Algo deu errado.'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#F9F8F6]">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2D7A4F' }}><ShoppingCart size={18} color="white" /></div>
          <span className="text-lg font-bold">Home Market</span>
        </div>
        <h2 className="text-2xl font-bold mb-1">Bem-vindo!</h2>
        <p className="text-[#6B6B6B] text-sm mb-8">Como você quer começar?</p>
        {mode === null ? (
          <div className="space-y-3 fade-in">
            <OptionCard icon={<Home size={20} style={{ color: '#2D7A4F' }} />} title="Criar minha família" sub="Serei o administrador da família" onClick={() => setMode('create')} />
            <OptionCard icon={<Users size={20} style={{ color: '#2D7A4F' }} />} title="Entrar em uma família" sub="Usar código de convite" onClick={() => setMode('join')} />
          </div>
        ) : (
          <div className="fade-in">
            <button onClick={() => { setMode(null); setValue(''); setError(''); }} className="text-xs text-[#6B6B6B] mb-4 hover:text-[#1A1A1A]">← Voltar</button>
            <div className="bg-white rounded-2xl border border-[#EBEBEB] shadow-sm p-6">
              <h3 className="font-semibold mb-1">{mode === 'create' ? 'Nome da família' : 'Código de convite'}</h3>
              <p className="text-xs text-[#6B6B6B] mb-4">{mode === 'create' ? 'Ex: Família Silva, Casa dos João...' : 'Peça o código ao administrador'}</p>
              <input autoFocus type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={mode === 'create' ? 'Ex: Família Silva' : 'Ex: ABC12345'} className="w-full px-4 py-3 border border-[#EBEBEB] rounded-xl text-sm placeholder-[#BDBDBD] focus:outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 transition-all mb-3" onKeyDown={e => e.key === 'Enter' && submit()} />
              {error && <p className="text-xs text-[#E05A3A] mb-3">{error}</p>}
              <button onClick={submit} disabled={!value.trim() || loading} className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#2D7A4F' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : (mode === 'create' ? 'Criar família' : 'Entrar na família')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OptionCard({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#EBEBEB] shadow-sm hover:border-[#2D7A4F]/40 hover:shadow-md transition-all active:scale-[0.98]">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8F5EE' }}>{icon}</div>
      <div className="text-left"><p className="font-semibold text-sm">{title}</p><p className="text-xs text-[#6B6B6B] mt-0.5">{sub}</p></div>
      <ArrowRight size={16} className="ml-auto text-[#BDBDBD]" />
    </button>
  );
}
