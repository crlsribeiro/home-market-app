import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Purchase, PurchaseItem } from '../types';
import Tesseract from 'tesseract.js';

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
    const r = await addDoc(collection(db, 'purchases'), {
      listId, householdId, weekLabel, total: 0,
      receiptUrl: null, receiptProcessed: false, createdAt: new Date()
    });
    return r.id;
  };

  const parseReceiptText = (text: string): Omit<PurchaseItem, 'id'>[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items: Omit<PurchaseItem, 'id'>[] = [];

    // Regex para capturar linha com preço no final
    // Exemplos: "CESAR DRY FLT MIGN VEG T 9.79" ou "HEB WHOLE CLOVES F 3.58"
    const priceRegex = /^(.+?)\s+[A-Z\*]?\s*([\d]+\.[\d]{2})\s*(?:HQ|FW|H|Q|T|F)?$/;
    
    // Palavras que indicam fim dos itens
    const stopWords = ['subtotal', 'total', 'tax', 'visa', 'cash', 'change', 'items', 'fsa', 'sale', 'savings'];

    for (const line of lines) {
      const lower = line.toLowerCase();
      
      // Para quando chega nas linhas de totais
      if (stopWords.some(w => lower.includes(w))) break;

      const match = line.match(priceRegex);
      if (!match) continue;

      let name = match[1].trim();
      const price = parseFloat(match[2]);

      if (!name || isNaN(price) || price <= 0 || price > 500) continue;

      // Remove número do início (ex: "1 CESAR..." ou "21 HEB...")
      name = name.replace(/^\d+\s+/, '');

      // Remove flags de tipo (T, F, FW, HQ, etc) do final do nome
      name = name.replace(/\s+[TFHQ]{1,2}$/, '').trim();

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
    // 1. Faz upload da imagem
    const sRef = ref(storage, `receipts/${purchaseId}/${file.name}`);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);

    // 2. Roda OCR com Tesseract
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => console.log(m),
    });

    console.log('OCR Text:', text);

    // 3. Parseia o texto para extrair itens
    let extractedItems = parseReceiptText(text);

    // 4. Se não extraiu nada, usa fallback
    if (extractedItems.length === 0) {
      extractedItems = [{ purchaseId, name: 'Receipt uploaded — items not recognized', quantity: 1, unitPrice: 0, totalPrice: 0 }];
    }

    // 5. Adiciona purchaseId nos itens
    const itemsWithId = extractedItems.map(i => ({ ...i, purchaseId }));

    // 6. Salva no Firestore
    const ids: string[] = [];
    for (const item of itemsWithId) {
      const r = await addDoc(collection(db, 'purchaseItems'), item);
      ids.push(r.id);
    }

    // 7. Calcula total
    const total = itemsWithId.reduce((s, i) => s + i.totalPrice, 0);

    // 8. Atualiza o purchase
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

  return { purchases, purchaseItems, loading, fetchPurchaseItems, createPurchaseForList, uploadReceipt };
}