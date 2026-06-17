import { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useHousehold } from './hooks/useHousehold';
import { useList } from './hooks/useList';
import { useHistory } from './hooks/useHistory';
import { Login } from './screens/Login';
import { Register, RegisterData } from './screens/Register';
import { Onboarding } from './screens/Onboarding';
import { MainList } from './screens/MainList';
import { ShoppingMode } from './screens/ShoppingMode';
import { ItemDetail } from './screens/ItemDetail';
import { AdminPanel } from './screens/AdminPanel';
import { History } from './screens/History';
import { BottomNav } from './components/BottomNav';
import { ToastContainer, useToast } from './components/Toast';
import { NotFoundModal } from './components/NotFoundModal';
import { ListItem, ItemStatus } from './types';

type Tab = 'list' | 'history' | 'admin';
type AuthScreen = 'login' | 'register';

export default function App() {
  const { appUser, loading, signInWithGoogle, signInWithEmail, registerUser, resetPassword, logout, refreshAppUser } = useAuth();
  const { household, members, createHousehold, joinHousehold, generateInviteLink } = useHousehold(appUser?.householdId ?? null);
  const { currentList, items, nextWeekItems, createList, addItem, toggleItem, markNotFound, resolveNotFound, approveItem, rejectItem, updateListStatus, doWeeklyCut, removeItem, updateItemNotes } = useList(appUser?.householdId ?? null);
  const { purchases, purchaseItems, fetchPurchaseItems, createPurchaseForList, uploadReceipt } = useHistory(appUser?.householdId ?? null);
  const { toasts, addToast, dismiss } = useToast();

  const [tab, setTab] = useState<Tab>('list');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);

  const togglingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const isAdmin = appUser?.role === 'admin';
  const pendingApprovals = items.filter(i => i.approvalStatus === 'pending' && (currentList?.status === 'locked' || currentList?.status === 'shopping'));
  const myNotFoundItems = items.filter(i => i.status === 'not_found' && i.addedByUid === appUser?.uid && !i.notFoundResolved);

  const handleToggleItem = async (id: string, status: string) => {
    if (togglingRef.current.has(id)) return;
    togglingRef.current.add(id);
    try {
      const it = items.find(i => i.id === id);
      if (!it) return;
      await toggleItem(id, status as ItemStatus);
      addToast(status === 'purchased' ? `${it.name} desmarcado` : `${it.name} comprado ✓`);
    } finally {
      setTimeout(() => togglingRef.current.delete(id), 800);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '3px solid #EBEBEB', borderTopColor: '#2D7A4F' }} />
            <p className="text-sm text-[#6B6B6B]">Carregando...</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (!appUser) {
    if (authScreen === 'register') {
      return (
        <Shell>
          <Register
            onBack={() => setAuthScreen('login')}
            onRegister={async (data: RegisterData) => {
              await registerUser(data);
              addToast('Conta criada com sucesso!');
            }}
          />
          <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </Shell>
      );
    }
    return (
      <Shell>
        <Login
          onSignIn={signInWithGoogle}
          onEmailSignIn={signInWithEmail}
          onResetPassword={resetPassword}
          onGoToRegister={() => setAuthScreen('register')}
        />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </Shell>
    );
  }

  if (!appUser.householdId) {
    return (
      <Shell>
        <Onboarding
          onCreateFamily={async name => { await createHousehold(name, appUser.uid); await refreshAppUser(); addToast('Família criada!'); }}
          onJoinFamily={async token => { const id = await joinHousehold(token, appUser.uid); if (!id) throw new Error('Código inválido. Verifique e tente novamente.'); await refreshAppUser(); addToast('Entrou na família!'); }}
        />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </Shell>
    );
  }

  if (currentList?.status === 'shopping' && tab === 'list' && !selectedItem) {
    if (isAdmin) {
      return (
        <Shell>
          <ShoppingMode
            list={currentList} items={items} isAdmin={!!isAdmin}
            onPicked={async id => { await toggleItem(id, 'pending'); addToast('Item pego ✓'); }}
            onNotFound={async id => { await markNotFound(id); addToast('Notificação enviada', 'info'); }}
            onCloseList={async () => {
              await doWeeklyCut(currentList.id);
              await createPurchaseForList(currentList.id, currentList.weekLabel);
              addToast('Lista fechada! Corte realizado.');
            }}
          />
          <BottomNav active={tab} onChange={setTab} isAdmin={!!isAdmin} />
          <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </Shell>
      );
    }

    return (
      <Shell>
        <ShoppingWaiting weekLabel={currentList.weekLabel} memberName={appUser.displayName.split(' ')[0]} />
        <BottomNav active={tab} onChange={setTab} isAdmin={!!isAdmin} />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </Shell>
    );
  }

  if (selectedItem && currentList) {
    const relPurchase = purchases.find(p => p.listId === currentList.id);
    const pItems = relPurchase ? (purchaseItems[relPurchase.id] || []) : [];
    const unitPrice = pItems.find(pi => pi.name.toLowerCase() === selectedItem.name.toLowerCase())?.unitPrice ?? null;
    return (
      <Shell>
        <ItemDetail
          item={selectedItem}
          list={currentList}
          unitPrice={unitPrice}
          isAdmin={!!isAdmin}
          onBack={() => setSelectedItem(null)}
          onMarkPurchased={async () => {
            await toggleItem(selectedItem.id, 'pending' as ItemStatus);
            addToast('Item comprado ✓');
            setSelectedItem(null);
          }}
          onRemove={async () => {
            await removeItem(selectedItem.id);
            addToast('Item removido', 'info');
            setSelectedItem(null);
          }}
          onUpdateNotes={async notes => {
            await updateItemNotes(selectedItem.id, notes);
            addToast('Observações salvas');
          }}
        />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </Shell>
    );
  }

  return (
    <Shell>
      {tab === 'list' && (
        <MainList
          appUser={appUser} currentList={currentList} items={items} nextWeekItems={nextWeekItems}
          onCreateList={async () => { await createList(); addToast('Lista criada!'); }}
          onAddItem={async (name, qty, notes, urgent, photoFile) => {
            if (!currentList) return;
            await addItem(currentList.id, name, qty, notes, urgent, appUser.uid, appUser.displayName, currentList.status, photoFile);
            addToast(currentList.status === 'open' ? `${name} adicionado!` : `${name} aguardando aprovação`);
          }}
          onToggleItem={handleToggleItem}
          onApprove={async id => { await approveItem(id); addToast('Item aprovado ✓'); }}
          onReject={async id => { await rejectItem(id); addToast('Item recusado', 'info'); }}
          onItemTap={setSelectedItem}
          onAdminCut={() => setTab('admin')}
          pendingApprovals={pendingApprovals}
          onNotFoundBannerTap={() => setShowNotFound(true)}
          onLogout={logout}
        />
      )}
      {tab === 'history' && (
        <History
          purchases={purchases}
          purchaseItems={purchaseItems}
          onFetchItems={fetchPurchaseItems}
          onUploadReceipt={uploadReceipt}
          addToast={addToast}
        />
      )}
      {tab === 'admin' && isAdmin && household && (
        <AdminPanel
          household={household} members={members} currentList={currentList} pendingApprovals={pendingApprovals} items={items}
          onApprove={async id => { await approveItem(id); addToast('Item aprovado ✓'); }}
          onReject={async id => { await rejectItem(id); addToast('Item recusado', 'info'); }}
          onLockList={async () => { if (!currentList) return; await updateListStatus(currentList.id, 'locked'); addToast('Lista travada 🔒'); }}
          onStartShopping={async () => { if (!currentList) return; await updateListStatus(currentList.id, 'shopping'); addToast('Modo mercado ativado 🛒'); }}
          onWeeklyCut={async () => { if (!currentList) return; await doWeeklyCut(currentList.id); await createPurchaseForList(currentList.id, currentList.weekLabel); }}
          onGenerateInvite={async () => household ? generateInviteLink(household.id) : ''}
          addToast={addToast}
        />
      )}
      <BottomNav active={tab} onChange={setTab} isAdmin={!!isAdmin} />
      {showNotFound && myNotFoundItems.length > 0 && (
        <NotFoundModal
          items={myNotFoundItems}
          onKeep={async id => { await resolveNotFound(id); addToast('Guardado para próxima semana', 'info'); }}
          onDiscard={async id => { await resolveNotFound(id); addToast('Item descartado', 'info'); }}
          onClose={() => setShowNotFound(false)}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </Shell>
  );
}

function ShoppingWaiting({ weekLabel, memberName }: { weekLabel: string; memberName: string }) {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center px-8 gap-6 pb-24">
      <div className="relative flex items-center justify-center">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center animate-bounce"
          style={{ backgroundColor: '#E8F5EE' }}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2D7A4F] animate-ping opacity-75" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2D7A4F]" />
      </div>

      <div className="text-center space-y-2">
        <p className="text-xl font-bold text-[#1A1A1A]">Compras em andamento</p>
        <p className="text-sm text-[#6B6B6B]">
          Olá, <span className="font-semibold text-[#1A1A1A]">{memberName}</span>! O admin está no mercado agora 🛒
        </p>
        <p className="text-xs text-[#BDBDBD] mt-1">SEMANA {weekLabel}</p>
      </div>

      <div className="w-full bg-white rounded-2xl border border-[#EBEBEB] p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <p className="text-sm text-[#6B6B6B]">Seus itens estão sendo coletados</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <p className="text-sm text-[#6B6B6B]">Você será notificado se algum item não for encontrado</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <p className="text-sm text-[#6B6B6B]">A lista será atualizada ao finalizar as compras</p>
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex justify-center">
      <div className="w-full max-w-[430px] relative min-h-screen">{children}</div>
    </div>
  );
}