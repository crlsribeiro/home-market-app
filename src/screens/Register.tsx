import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Loader2, Eye, EyeOff, Mail, Lock, User, Phone, ChevronDown } from 'lucide-react';

interface CountryOption {
  code: string;
  flag: string;
  ddi: string;
  maxLength: number;
  format: (digits: string) => string;
}

const countries: CountryOption[] = [
  {
    code: 'BR', flag: '🇧🇷', ddi: '+55', maxLength: 11,
    format: (d) => {
      if (d.length <= 2) return `(${d})`;
      if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
      return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
    }
  },
  {
    code: 'US', flag: '🇺🇸', ddi: '+1', maxLength: 10,
    format: (d) => d.length <= 3 ? `(${d})` : d.length <= 6 ? `(${d.slice(0,3)}) ${d.slice(3)}` : `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`
  },
  {
    code: 'PT', flag: '🇵🇹', ddi: '+351', maxLength: 9,
    format: (d) => d.length <= 3 ? d : d.length <= 6 ? `${d.slice(0,3)} ${d.slice(3)}` : `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,9)}`
  },
];

interface RegisterProps {
  onBack: () => void;
  onRegister: (data: RegisterData) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string;
  photoFile: File | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
}

export function Register({ onBack, onRegister }: RegisterProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(countries[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (!firstName && !lastName) return '';
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, selectedCountry.maxLength);
    setPhone(digits);
  };

  const formatPhoneDisplay = () => {
    if (!phone) return '';
    return selectedCountry.format(phone);
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'Nome e obrigatorio';
    if (!lastName.trim()) newErrors.lastName = 'Sobrenome e obrigatorio';

    if (!email.trim()) newErrors.email = 'Email e obrigatorio';
    else if (!validateEmail(email)) newErrors.email = 'Email invalido';

    if (!password) newErrors.password = 'Senha e obrigatoria';
    else if (password.length < 8) newErrors.password = 'Minimo 8 caracteres';

    if (!confirmPassword) newErrors.confirmPassword = 'Confirme a senha';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Senhas nao coincidem';

    if (!phone) newErrors.phone = 'Celular e obrigatorio';
    else if (phone.length < selectedCountry.maxLength) newErrors.phone = `Numero incompleto — digite ${selectedCountry.maxLength} digitos`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;
    setLoading(true);
    try {
      await onRegister({ email, password, firstName, lastName, phone, phoneCountryCode: selectedCountry.ddi, photoFile });
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : '';
      if (message.includes('email-already-in-use')) setSubmitError('Este e-mail ja esta cadastrado');
      else if (message.includes('weak-password')) setSubmitError('Senha muito fraca');
      else setSubmitError('Erro ao criar conta. Tente novamente.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6]">
      <div className="sticky top-0 z-10 bg-[#F9F8F6] border-b border-[#EBEBEB]">
        <div className="flex items-center gap-3 px-4 py-4 max-w-[430px] mx-auto w-full">
          <button onClick={onBack} className="p-1 -ml-1">
            <ArrowLeft size={24} className="text-[#2D2D2D]" />
          </button>
          <h1 className="text-xl font-semibold">Criar conta</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-[430px] mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Foto */}
          <div className="flex flex-col items-center mb-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-[#EBEBEB] flex items-center justify-center overflow-hidden border-2 border-dashed border-[#BDBDBD] hover:border-[#2D7A4F] transition-colors"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : getInitials() ? (
                <span className="text-2xl font-semibold text-[#6B6B6B]">{getInitials()}</span>
              ) : (
                <div className="flex flex-col items-center text-[#BDBDBD]">
                  <Camera size={24} />
                  <span className="text-xs mt-1">Foto</span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2D7A4F] flex items-center justify-center">
                <Camera size={16} className="text-white" />
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <p className="text-xs text-[#BDBDBD] mt-2">Foto de perfil (opcional)</p>
          </div>

          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Nome *</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
                <input
                  type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${errors.firstName ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#EBEBEB] focus:border-[#2D7A4F] focus:ring-[#2D7A4F]'}`}
                />
              </div>
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Sobrenome *</label>
              <input
                type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sobrenome"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${errors.lastName ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#EBEBEB] focus:border-[#2D7A4F] focus:ring-[#2D7A4F]'}`}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Email *</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#EBEBEB] focus:border-[#2D7A4F] focus:ring-[#2D7A4F]'}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Senha *</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 8 caracteres"
                className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#EBEBEB] focus:border-[#2D7A4F] focus:ring-[#2D7A4F]'}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Confirmar senha *</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
              <input
                type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme sua senha"
                className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#EBEBEB] focus:border-[#2D7A4F] focus:ring-[#2D7A4F]'}`}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Celular */}
          <div>
            <label className="block text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Celular *</label>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl border border-[#EBEBEB] bg-white text-sm hover:bg-gray-50 transition-all"
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-[#6B6B6B]">{selectedCountry.ddi}</span>
                  <ChevronDown size={16} className="text-[#BDBDBD]" />
                </button>
                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-[#EBEBEB] shadow-lg z-20 py-1 min-w-[140px]">
                    {countries.map((c) => (
                      <button
                        key={c.code} type="button"
                        onClick={() => { setSelectedCountry(c); setPhone(''); setShowCountryDropdown(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span className="text-[#6B6B6B]">{c.ddi}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
                <input
                  type="tel"
                  value={formatPhoneDisplay()}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={selectedCountry.code === 'BR' ? '(11) 99999-9999' : 'Numero do celular'}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${errors.phone ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#EBEBEB] focus:border-[#2D7A4F] focus:ring-[#2D7A4F]'}`}
                />
              </div>
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {submitError && <p className="text-red-500 text-sm text-center">{submitError}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-4"
            style={{ backgroundColor: '#2D7A4F' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Criar conta'}
          </button>

          <p className="text-xs text-[#BDBDBD] text-center mt-4 leading-relaxed">
            Ao criar uma conta, voce concorda com nossos <span className="text-[#6B6B6B] font-medium">Termos de Uso</span>
          </p>
        </form>
      </div>
    </div>
  );
}