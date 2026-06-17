import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken } from 'firebase/messaging';
import { auth, db, storage, googleProvider, app } from '../lib/firebase';
import { AppUser } from '../types';

const VAPID_KEY = 'BEYEtt0ySazh607RjOffQJBAUBtDyW8u3L5cEd4Ld1W8t-mPoH8oRSFiVIwaA1HSxwhGwEu3NH1AYyjRA2_gnPE';

const registerFCMToken = async (uid: string) => {
  try {
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await updateDoc(doc(db, 'users', uid), { fcmToken: token });
    }
  } catch (e) {
    console.log('FCM token error:', e);
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const snap = await getDoc(doc(db, 'users', result.user.uid));
        if (!snap.exists()) {
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid, displayName: result.user.displayName || 'Usuário', email: result.user.email || '',
            photoURL: result.user.photoURL, householdId: null, role: 'member', joinedAt: serverTimestamp(),
          });
        }
        await registerFCMToken(result.user.uid);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fu) => {
      setUser(fu);
      if (fu) {
        const snap = await getDoc(doc(db, 'users', fu.uid));
        if (snap.exists()) {
          const d = snap.data();
          setAppUser({
            uid: fu.uid, displayName: fu.displayName || 'Usuário', email: fu.email || '',
            photoURL: fu.photoURL, householdId: d.householdId || null, role: d.role || 'member',
            joinedAt: d.joinedAt?.toDate() || new Date(),
          });
          await registerFCMToken(fu.uid);
        } else {
          await setDoc(doc(db, 'users', fu.uid), {
            uid: fu.uid, displayName: fu.displayName || 'Usuário', email: fu.email || '',
            photoURL: fu.photoURL, householdId: null, role: 'member', joinedAt: serverTimestamp(),
          });
          setAppUser({
            uid: fu.uid, displayName: fu.displayName || 'Usuário', email: fu.email || '',
            photoURL: fu.photoURL, householdId: null, role: 'member', joinedAt: new Date(),
          });
          await registerFCMToken(fu.uid);
        }
      } else { setAppUser(null); }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => { await signInWithRedirect(auth, googleProvider); };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid, displayName: 'Usuario', email: result.user.email || '',
      photoURL: null, householdId: null, role: 'member', joinedAt: serverTimestamp(),
    });
    await registerFCMToken(result.user.uid);
  };

  const registerUser = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    phoneCountryCode: string;
    photoFile: File | null;
  }) => {
    const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
    let photoURL: string | null = null;

    if (data.photoFile) {
      const fileRef = ref(storage, `users/${result.user.uid}/avatar`);
      await uploadBytes(fileRef, data.photoFile);
      photoURL = await getDownloadURL(fileRef);
      await updateProfile(result.user, {
        displayName: `${data.firstName} ${data.lastName}`,
        photoURL,
      });
    } else {
      await updateProfile(result.user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });
    }

    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      phoneCountryCode: data.phoneCountryCode,
      photoURL,
      provider: 'email',
      householdId: null,
      role: 'member',
      joinedAt: serverTimestamp(),
    });
    await registerFCMToken(result.user.uid);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshAppUser = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return;
    const d = snap.data();
    setAppUser({
      uid: user.uid, displayName: user.displayName || 'Usuário', email: user.email || '',
      photoURL: user.photoURL, householdId: d.householdId || null, role: d.role || 'member',
      joinedAt: d.joinedAt?.toDate() || new Date(),
    });
  };

  return { user, appUser, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, registerUser, resetPassword, logout, refreshAppUser };
}