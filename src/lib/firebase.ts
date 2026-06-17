import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAlcIVw0u-IaPDil1WF1t6inXnE3zrj0kU",
  authDomain: "home-market-3d9da.firebaseapp.com",
  projectId: "home-market-3d9da",
  storageBucket: "home-market-3d9da.firebasestorage.app",
  messagingSenderId: "121839046609",
  appId: "1:121839046609:web:60cd8cd464fbc9b17d1af0",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
