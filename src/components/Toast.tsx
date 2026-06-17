import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { ToastMsg } from '../types';

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 left-1/2 z-50 flex flex-col gap-2 w-[min(360px,90vw)]" style={{ transform: 'translateX(-50%)' }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMsg; onDismiss: (id: string) => void }) {
  useEffect(() => { const t = setTimeout(() => onDismiss(toast.id), 3500); return () => clearTimeout(t); }, [toast.id, onDismiss]);
  const icons = { success: <CheckCircle size={16} className="text-green-600 flex-shrink-0" />, error: <XCircle size={16} className="text-red-500 flex-shrink-0" />, info: <Info size={16} className="text-blue-500 flex-shrink-0" /> };
  const bg = { success: 'border-green-200', error: 'border-red-200', info: 'border-blue-200' };
  return (
    <div className={`toast-in flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white shadow-lg cursor-pointer ${bg[toast.type]}`} onClick={() => onDismiss(toast.id)}>
      {icons[toast.type]}
      <p className="text-sm font-medium text-gray-800 leading-snug">{toast.message}</p>
    </div>
  );
}

let counter = 0;
export function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const addToast = (message: string, type: ToastMsg['type'] = 'success') => setToasts(p => [...p, { id: String(++counter), message, type }]);
  const dismiss = (id: string) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, addToast, dismiss };
}
