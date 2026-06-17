import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Purchase, PurchaseItem } from '../types';

export function useHistory(householdId: string | null) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<Record<string, PurchaseItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) { setPurchases([]); setLoading(false); return; }
    const q = query(collection(db, 'purchases'), where('householdId', '==', householdId));
    const unsub = onSnapshot(q, snap => {
      const sortedPurchases = snap.docs
        .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() || new Date() }))
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)) as Purchase[];
      setPurchases(sortedPurchases);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching purchases:', err);
      setLoading(false);
    });
    return unsub;
  }, [householdId]);

  const fetchPurchaseItems = async (purchaseId: string) => {
    if (purchaseItems[purchaseId]) return;
    const snap = await getDocs(query(collection(db, 'purchaseItems'), where('purchaseId', '==', purchaseId)));
    setPurchaseItems(prev => ({ ...prev, [purchaseId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) as PurchaseItem[] }));
  };

  const createPurchaseForList = async (listId: string, weekLabel: string): Promise<string> => {
    const r = await addDoc(collection(db, 'purchases'), { listId, householdId, weekLabel, total: 0, receiptUrl: null, receiptProcessed: false, createdAt: new Date() });
    return r.id;
  };

  const uploadReceipt = async (purchaseId: string, file: File): Promise<void> => {
    const sRef = ref(storage, `receipts/${purchaseId}/${file.name}`);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    await new Promise(res => setTimeout(res, 2000));
    const mockItems: Omit<PurchaseItem, 'id'>[] = [
      { purchaseId, name: 'Item processado 1', quantity: 1, unitPrice: 4.99, totalPrice: 4.99 },
      { purchaseId, name: 'Item processado 2', quantity: 2, unitPrice: 2.50, totalPrice: 5.00 },
    ];
    const ids: string[] = [];
    for (const item of mockItems) { const r = await addDoc(collection(db, 'purchaseItems'), item); ids.push(r.id); }
    await updateDoc(doc(db, 'purchases', purchaseId), { receiptUrl: url, receiptProcessed: true, total: mockItems.reduce((s, i) => s + i.totalPrice, 0) });
    setPurchaseItems(prev => ({ ...prev, [purchaseId]: mockItems.map((item, i) => ({ id: ids[i], ...item })) }));
  };

  return { purchases, purchaseItems, loading, fetchPurchaseItems, createPurchaseForList, uploadReceipt };
}
