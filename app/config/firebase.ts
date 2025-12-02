// app/config/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAv5iyGz1zYwW_bFvg92VWagINcHjNNiSU",
  authDomain: "harvesthub-fe2bd.firebaseapp.com",
  projectId: "harvesthub-fe2bd",
  storageBucket: "harvesthub-fe2bd.firebasestorage.app",
  messagingSenderId: "822206956687",
  appId: "1:822206956687:web:a6477536c192798f0c9cfa",
  measurementId: "G-84282FEHBV"
};

// Initialize Firebase (avoid duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set auth persistence to LOCAL (survives browser restarts)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

  // Enable offline persistence for Firestore
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser doesn\'t support offline persistence');
    } else {
      console.error('Error enabling persistence:', err);
    }
  });
}