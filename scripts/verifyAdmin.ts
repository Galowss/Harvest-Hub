// Script to verify and fix admin permissions
// Run this with: npx tsx scripts/verifyAdmin.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase config (use your actual config)
const firebaseConfig = {
  // Add your config here from app/config/firebase.ts
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function verifyAdminRole(email: string) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ No user is currently logged in');
      console.log('Please log in to your admin account first');
      return;
    }

    console.log('🔍 Checking user:', currentUser.email);
    console.log('🆔 User ID:', currentUser.uid);

    // Get user document
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (!userDoc.exists()) {
      console.error('❌ User document does not exist in Firestore');
      console.log('Creating user document with admin role...');
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        email: currentUser.email,
        role: 'admin',
        createdAt: new Date(),
        name: currentUser.displayName || 'Admin User'
      });
      
      console.log('✅ Admin user document created successfully!');
      return;
    }

    const userData = userDoc.data();
    console.log('📄 Current user data:', userData);

    if (userData.role === 'admin') {
      console.log('✅ User already has admin role');
    } else {
      console.log('⚠️ User does NOT have admin role. Current role:', userData.role);
      console.log('Updating to admin...');
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: 'admin'
      });
      
      console.log('✅ User promoted to admin successfully!');
    }

    // Verify the update
    const updatedDoc = await getDoc(doc(db, 'users', currentUser.uid));
    console.log('✅ Final user role:', updatedDoc.data()?.role);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
console.log('🚀 Starting admin role verification...\n');
verifyAdminRole(process.argv[2] || '');
