import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Purchase, PurchaseItem } from '../types';
import Tesseract from 'tesseract.js';

export function useHistory(householdId: string | null) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<Record<string, PurchaseItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setPurchases([]);
      setLoading(false);
      return;
    }
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
    const snap = await getDocs(query(collection(db, 'purchaseItems'), where('purchaseId', '==', purchaseId)));
    setPurchaseItems(prev => ({
      ...prev,
      [purchaseId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) as PurchaseItem[]
    }));
  };

  const createPurchaseForList = async (listId: string, weekLabel: string): Promise<string> => {
    const r = await addDoc(collection(db, 'purchases'), {
      listId,
      householdId,
      weekLabel,
      total: 0,
      receiptUrl: null,
      receiptProcessed: false,
      createdAt: new Date()
    });
    return r.id;
  };

  const parseReceiptText = (text: string): Omit<PurchaseItem, 'id'>[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items: Omit<PurchaseItem, 'id'>[] = [];

    const hebItemRegex = /^(?:\d+\s+)?(.+?)\s+(\d+\.\d{2})(?:\s+[A-Z]{1,2})?$/i;
    const strictStopWords = ['subtotal', 'total sale', 'tax', 'visa', 'mastercard', 'cash', 'change', 'items purchased', 'account #'];

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (strictStopWords.some(w => lower.includes(w))) break;
      if (lower.includes('lbs @') || lower.includes('ea. @')) continue;

      const match = line.match(hebItemRegex);
      if (!match) continue;

      let name = match[1].trim();
      const price = parseFloat(match[2]);

      if (!name || isNaN(price) || price <= 0 || price > 500) continue;

      name = name.replace(/^\d+\s+/, '').trim();

      if (name.length < 2) continue;

      items.push({
        purchaseId: '',
        name,
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
      });
    }

    return items;
  };

  const uploadReceipt = async (purchaseId: string, file: File): Promise<void> => {
    const sRef = ref(storage, `receipts/${purchaseId}/${file.name}`);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);

    const { data: { text } } = await Tesseract.recognize(file, 'eng');
    console.log('OCR Text:', text);

    let extractedItems = parseReceiptText(text);

    if (extractedItems.length === 0) {
      extractedItems = [{
        purchaseId,
        name: 'Nenhum item reconhecido (Clique no lápis para adicionar)',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }];
    }

    // Limpa os itens antigos dessa compra antes de salvar os novos
    const oldDocs = await getDocs(query(collection(db, 'purchaseItems'), where('purchaseId', '==', purchaseId)));
    for (const d of oldDocs.docs) {
      await deleteDoc(doc(db, 'purchaseItems', d.id));
    }

    const itemsWithId = extractedItems.map(i => ({ ...i, purchaseId }));

    const ids: string[] = [];
    for (const item of itemsWithId) {
      const r = await addDoc(collection(db, 'purchaseItems'), item);
      ids.push(r.id);
    }

    const total = itemsWithId.reduce((s, i) => s + i.totalPrice, 0);

    await updateDoc(doc(db, 'purchases', purchaseId), {
      receiptUrl: url,
      receiptProcessed: true,
      total: parseFloat(total.toFixed(2)),
    });

    setPurchaseItems(prev => ({
      ...prev,
      [purchaseId]: itemsWithId.map((item, i) => ({ id: ids[i], ...item })),
    }));
  };

  const updateItemPrice = async (purchaseId: string, itemId: string, newUnitPrice: number, newName?: string) => {
    const itemRef = doc(db, 'purchaseItems', itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) return;

    const currentData = itemSnap.data();
    const qty = currentData.quantity || 1;
    const newTotalPrice = parseFloat((newUnitPrice * qty).toFixed(2));

    await updateDoc(itemRef, {
      unitPrice: newUnitPrice,
      totalPrice: newTotalPrice,
      ...(newName ? { name: newName.trim() } : {})
    });

    const snap = await getDocs(query(collection(db, 'purchaseItems'), where('purchaseId', '==', purchaseId)));
    const updatedList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PurchaseItem[];
    const newTotal = updatedList.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    await updateDoc(doc(db, 'purchases', purchaseId), {
      total: parseFloat(newTotal.toFixed(2))
    });

    setPurchaseItems(prev => ({
      ...prev,
      [purchaseId]: updatedList
    }));
  };

  return {
    purchases,
    purchaseItems,
    loading,
    fetchPurchaseItems,
    createPurchaseForList,
    uploadReceipt,
    updateItemPrice
  };
}