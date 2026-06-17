import { List, Clock, ShieldCheck } from 'lucide-react';
type Tab = 'list' | 'history' | 'admin';
export function BottomNav({ active, onChange, isAdmin }: { active: Tab; onChange: (t: Tab) => void; isAdmin: boolean }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'list', label: 'Lista', icon: <List size={22} /> },
    ...(isAdmin ? [{ id: 'history' as Tab, label: 'Histórico', icon: <Clock size={22} /> }] : []),
    ...(isAdmin ? [{ id: 'admin' as Tab, label: 'Admin', icon: <ShieldCheck size={22} /> }] : []),
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#EBEBEB] pb-safe z-40">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map(tab => {
          const on = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all" style={{ color: on ? '#2D7A4F' : '#6B6B6B' }}>
              {tab.icon}
              <span className={`text-xs ${on ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}