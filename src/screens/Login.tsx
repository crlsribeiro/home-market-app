import { useState } from 'react';
import { ShoppingCart, Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface LoginProps {
  onSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onGoToRegister: () => void;
}

export function Login({ onSignIn, onEmailSignIn, onResetPassword, onGoToRegister }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await onSignIn();
    } catch {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onEmailSignIn(email, password);
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : 'Erro ao entrar';
      if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password') || message.includes('auth/user-not-found')) {
        setError('Email ou senha incorretos');
      } else if (message.includes('auth/invalid-email')) {
        setError('Email invalido');
      } else {
        setError('Erro ao entrar. Tente novamente.');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await onResetPassword(resetEmail);
      setResetSent(true);
    } catch {
      setError('Erro ao enviar email de recuperacao');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#F9F8F6]">
      <div className="w-full max-w-[360px] flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3" style={{ backgroundColor: '#2D7A4F' }}>
          <ShoppingCart size={28} color="white" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Home Market</h1>
        <p className="text-[#6B6B6B] text-base text-center mb-8 leading-relaxed">Gestao de compras da sua familia</p>

        <div className="w-full bg-white rounded-2xl shadow-sm border border-[#EBEBEB] p-6">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EBEBEB] text-sm focus:outline-none focus:border-[#2D7A4F] focus:ring-1 focus:ring-[#2D7A4F] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#EBEBEB] text-sm focus:outline-none focus:border-[#2D7A4F] focus:ring-1 focus:ring-[#2D7A4F] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#6B6B6B] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}

            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setShowResetModal(true);
                  setResetSent(false);
                }}
                className="text-xs text-[#2D7A4F] font-medium hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              style={{ backgroundColor: '#2D7A4F' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Entrar'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-sm text-[#2D7A4F] font-medium hover:underline"
              >
                Criar conta
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#EBEBEB]" />
            <span className="text-xs text-[#BDBDBD] font-medium">ou</span>
            <div className="flex-1 h-px bg-[#EBEBEB]" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border border-[#EBEBEB] bg-white text-sm font-semibold shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-[#6B6B6B]" /> : <GoogleIcon />}
            Continuar com Google
          </button>
        </div>

        <p className="text-xs text-[#BDBDBD] text-center mt-6 leading-relaxed max-w-[260px]">
          Ao entrar, voce concorda com nossos <span className="text-[#6B6B6B] font-medium">Termos de Uso</span>
        </p>
        <p className="text-xs text-[#BDBDBD] mt-4">v1.0 - MVP</p>
        <p className="text-xs text-[#BDBDBD] mt-1">Desenvolvido por CrSolutions</p>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
            {resetSent ? (
              <>
                <h3 className="text-lg font-semibold mb-2">Email enviado</h3>
                <p className="text-sm text-[#6B6B6B] mb-4">
                  Se o email existir em nossa base, voce recebera as instrucoes para redefinir sua senha.
                </p>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: '#2D7A4F' }}
                >
                  Fechar
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">Recuperar senha</h3>
                <p className="text-sm text-[#6B6B6B] mb-4">
                  Digite seu email para receber as instrucoes de recuperacao.
                </p>
                <form onSubmit={handleResetPassword}>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#EBEBEB] text-sm focus:outline-none focus:border-[#2D7A4F] focus:ring-1 focus:ring-[#2D7A4F] transition-all mb-4"
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="flex-1 py-3 rounded-xl border border-[#EBEBEB] text-sm font-semibold text-[#6B6B6B] hover:bg-gray-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 py-3 rounded-xl text-white text-sm font-semibold"
                      style={{ backgroundColor: '#2D7A4F' }}
                    >
                      {resetLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Enviar'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
