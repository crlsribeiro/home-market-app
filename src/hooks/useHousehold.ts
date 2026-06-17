import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Household, AppUser } from '../types';
import { generateToken } from '../lib/utils';

export function useHousehold(householdId: string | null) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) { setHousehold(null); setMembers([]); setLoading(false); return; }
    const unsub = onSnapshot(doc(db, 'households', householdId), async (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const h: Household = {
          id: snap.id, name: d.name, adminUid: d.adminUid, inviteToken: d.inviteToken,
          memberUids: d.memberUids || [], createdAt: d.createdAt?.toDate() || new Date(),
        };
        setHousehold(h);
        if (h.memberUids.length > 0) {
          const snaps = await Promise.all(h.memberUids.map(uid => getDoc(doc(db, 'users', uid))));
          setMembers(snaps.filter(s => s.exists()).map(s => {
            const d = s.data()!;
            return { uid: s.id, displayName: d.displayName, email: d.email, photoURL: d.photoURL, householdId: d.householdId, role: d.role, joinedAt: d.joinedAt?.toDate() || new Date() };
          }));
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [householdId]);

  const createHousehold = async (name: string, uid: string): Promise<string> => {
    const id = generateToken(20);
    const inviteToken = generateToken(8);
    await setDoc(doc(db, 'households', id), { name, adminUid: uid, inviteToken, memberUids: [uid], createdAt: new Date() });
    await updateDoc(doc(db, 'users', uid), { householdId: id, role: 'admin' });
    return id;
  };

  const joinHousehold = async (token: string, uid: string): Promise<string | null> => {
    const snap = await getDocs(query(collection(db, 'households'), where('inviteToken', '==', token.trim())));
    if (snap.empty) return null;
    const hDoc = snap.docs[0];
    const uids: string[] = hDoc.data().memberUids || [];
    if (!uids.includes(uid)) await updateDoc(doc(db, 'households', hDoc.id), { memberUids: [...uids, uid] });
    await updateDoc(doc(db, 'users', uid), { householdId: hDoc.id, role: 'member' });
    return hDoc.id;
  };

  const generateInviteLink = async (hid: string): Promise<string> => {
    const token = generateToken(8);
    await updateDoc(doc(db, 'households', hid), { inviteToken: token });
    return token;
  };

  return { household, members, loading, createHousehold, joinHousehold, generateInviteLink };
}
