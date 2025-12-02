import { db } from '../app/config/firebase';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';

async function setAdminRole() {
  console.log('🔍 Searching for users to make admin...\n');

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    console.log(`Found ${usersSnapshot.size} users in database\n`);
    
    usersSnapshot.forEach((userDoc) => {
      const data = userDoc.data();
      console.log(`📧 ${data.email || 'No email'}`);
      console.log(`   ID: ${userDoc.id}`);
      console.log(`   Role: ${data.role || 'NOT SET'}`);
      console.log(`   Name: ${data.name || 'N/A'}\n`);
    });

    // Prompt user for which email to make admin
    console.log('\n⚠️  To make a user admin, edit this script and uncomment the code below:\n');
    console.log('// const emailToMakeAdmin = "your-email@example.com";');
    console.log('// const userToUpdate = usersSnapshot.docs.find(doc => doc.data().email === emailToMakeAdmin);');
    console.log('// if (userToUpdate) {');
    console.log('//   await updateDoc(doc(db, "users", userToUpdate.id), { role: "admin" });');
    console.log('//   console.log("✅ Successfully set admin role!");');
    console.log('// }');

    // UNCOMMENT AND EDIT THIS SECTION:
    // ============================================
    // const emailToMakeAdmin = "YOUR_EMAIL_HERE@example.com";
    // const userToUpdate = usersSnapshot.docs.find(doc => doc.data().email === emailToMakeAdmin);
    // 
    // if (userToUpdate) {
    //   console.log(`\n🔄 Updating ${emailToMakeAdmin} to admin...`);
    //   await updateDoc(doc(db, "users", userToUpdate.id), { 
    //     role: "admin" 
    //   });
    //   console.log("✅ Successfully set admin role!");
    //   
    //   // Verify
    //   const updated = await getDoc(doc(db, "users", userToUpdate.id));
    //   console.log("✅ Verified role:", updated.data()?.role);
    // } else {
    //   console.log("❌ User not found with that email");
    // }
    // ============================================

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setAdminRole();
