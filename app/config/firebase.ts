// app/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);