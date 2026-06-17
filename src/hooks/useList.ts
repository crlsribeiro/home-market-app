import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { WeekList, ListItem, ListStatus, ItemStatus } from '../types';
import { getWeekLabel, getWeekStart, getWeekEnd } from '../lib/utils';

export function useList(householdId: string | null) {
  const [currentList, setCurrentList] = useState<WeekList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [nextWeekItems, setNextWeekItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) { setCurrentList(null); setItems([]); setLoading(false); return; }
    const q = query(collection(db, 'lists'), where('householdId', '==', householdId));
    const unsub = onSnapshot(q, snap => {
      const activeStatuses = ['open', 'locked', 'shopping'];
      const activeLists = snap.docs
        .map(d => ({ id: d.id, data: d.data() }))
        .filter(({ data }) => activeStatuses.includes(data.status))
        .sort((a, b) => (b.data.createdAt?.toDate()?.getTime() || 0) - (a.data.createdAt?.toDate()?.getTime() || 0));

      if (activeLists.length > 0) {
        const d = activeLists[0].data;
        setCurrentList({
          id: activeLists[0].id, householdId: d.householdId, weekLabel: d.weekLabel,
          weekStart: d.weekStart?.toDate() || new Date(), weekEnd: d.weekEnd?.toDate() || new Date(),
          status: d.status, createdAt: d.createdAt?.toDate() || new Date(), closedAt: d.closedAt?.toDate() || null,
        });
      } else { setCurrentList(null); }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching lists:', err);
      setLoading(false);
    });
    return unsub;
  }, [householdId]);

  useEffect(() => {
    if (!currentList) { setItems([]); return; }
    const q = query(collection(db, 'items'), where('listId', '==', currentList.id));
    const unsub = onSnapshot(q, snap => {
      const validStatuses = ['pending', 'purchased', 'not_found'];
      const sortedItems = snap.docs
        .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))
        .filter((d) => validStatuses.includes(d.status))
        .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)) as ListItem[];
      setItems(sortedItems);
    }, (err) => console.error('Error fetching items:', err));
    return unsub;
  }, [currentList?.id]);

  useEffect(() => {
    if (!householdId) return;
    const q = query(collection(db, 'items'), where('householdId', '==', householdId), where('status', '==', 'rolled_over'));
    const unsub = onSnapshot(q, snap => {
      const sortedItems = snap.docs
        .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))
        .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)) as ListItem[];
      setNextWeekItems(sortedItems);
    }, (err) => console.error('Error fetching next week items:', err));
    return unsub;
  }, [householdId]);

  const createList = async () => {
    const now = new Date();
    await addDoc(collection(db, 'lists'), {
      householdId, weekLabel: getWeekLabel(now), weekStart: getWeekStart(now),
      weekEnd: getWeekEnd(now), status: 'open', createdAt: serverTimestamp(), closedAt: null,
    });
  };

  const addItem = async (
    listId: string, name: string, quantity: number, notes: string,
    urgent: boolean, addedByUid: string, addedByName: string,
    listStatus: ListStatus, photoFile: File | null
  ) => {
    let photoURL: string | null = null;

    // Primeiro cria o item para ter o ID
    const docRef = await addDoc(collection(db, 'items'), {
      listId, householdId, name, quantity, notes, urgent, addedByUid, addedByName,
      status: 'pending', approvalStatus: listStatus === 'open' ? 'not_required' : 'pending',
      notFoundResolved: false, photoURL: null, createdAt: serverTimestamp(),
    });

    // Se tem foto, faz upload e atualiza o item
    if (photoFile) {
      const fileRef = ref(storage, `households/${householdId}/items/${docRef.id}/photo`);
      await uploadBytes(fileRef, photoFile);
      photoURL = await getDownloadURL(fileRef);
      await updateDoc(doc(db, 'items', docRef.id), { photoURL });
    }
  };

  const toggleItem = async (itemId: string, currentStatus: ItemStatus) => {
    await updateDoc(doc(db, 'items', itemId), { status: currentStatus === 'purchased' ? 'pending' : 'purchased' });
  };

  const markNotFound = async (itemId: string) => {
    await updateDoc(doc(db, 'items', itemId), { status: 'not_found' });
  };

  const resolveNotFound = async (itemId: string) => {
    await updateDoc(doc(db, 'items', itemId), { status: 'rolled_over', notFoundResolved: true });
  };

  const approveItem = async (itemId: string) => {
    await updateDoc(doc(db, 'items', itemId), { approvalStatus: 'approved' });
  };

  const rejectItem = async (itemId: string) => {
    await updateDoc(doc(db, 'items', itemId), { approvalStatus: 'rejected', status: 'rolled_over' });
  };

  const updateListStatus = async (listId: string, status: ListStatus) => {
    await updateDoc(doc(db, 'lists', listId), { status, ...(status === 'closed' ? { closedAt: serverTimestamp() } : {}) });
  };

  const doWeeklyCut = async (listId: string) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'lists', listId), { status: 'closed', closedAt: serverTimestamp() });
    items.filter(i => i.status === 'pending' && i.approvalStatus !== 'pending').forEach(i => {
      batch.update(doc(db, 'items', i.id), { status: 'rolled_over' });
    });
    await batch.commit();
  };

  const removeItem = async (itemId: string) => {
  await deleteDoc(doc(db, 'items', itemId)); // ✅ Remove de verdade
  };

  const updateItemNotes = async (itemId: string, notes: string) => {
    await updateDoc(doc(db, 'items', itemId), { notes });
  };

  return { currentList, items, nextWeekItems, loading, createList, addItem, toggleItem, markNotFound, resolveNotFound, approveItem, rejectItem, updateListStatus, doWeeklyCut, removeItem, updateItemNotes };
}
