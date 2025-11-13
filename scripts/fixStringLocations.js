// Fix specific farmers: Dale Lianne and Galo bels
// Run this in browser console from /dashboard/map

(async () => {
  try {
    const firebaseModule = await import('../../config/firebase.ts');
    const firestoreModule = await import('firebase/firestore');
    
    const { db } = firebaseModule;
    const { collection, getDocs, query, where, updateDoc, doc } = firestoreModule;
    
    console.log('🔧 Fixing farmers with string locations...\n');
    
    const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
    const snapshot = await getDocs(farmersQuery);
    
    const locationMap = {
      'olongop': { lat: 14.8833, lng: 120.2833, address: 'Olongapo City' },
      'olongopo': { lat: 14.8833, lng: 120.2833, address: 'Olongapo City' },
      'olongapo': { lat: 14.8833, lng: 120.2833, address: 'Olongapo City' },
    };
    
    let fixed = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const name = data.name || data.email;
      
      // Check if location is a string
      if (data.location && typeof data.location === 'string') {
        const locationStr = data.location.toLowerCase();
        const coords = locationMap[locationStr];
        
        if (coords) {
          await updateDoc(doc(db, 'users', docSnap.id), {
            location: {
              lat: coords.lat,
              lng: coords.lng,
              address: coords.address
            }
          });
          console.log(`✅ Fixed ${name}:`);
          console.log(`   Old: location = "${data.location}"`);
          console.log(`   New: location = { lat: ${coords.lat}, lng: ${coords.lng}, address: "${coords.address}" }`);
          fixed++;
        } else {
          console.log(`⚠️ ${name}: Unknown location string "${data.location}"`);
          console.log(`   → Have them set location via /dashboard/farmer/location`);
        }
      } else if (data.location?.lat) {
        console.log(`✅ ${name}: Already has correct structure`);
      } else {
        console.log(`⚠️ ${name}: No location data`);
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Fixed ${fixed} farmers`);
    console.log(`🔄 Press F5 to refresh the page`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Alternative: Have farmers set location via /dashboard/farmer/location');
  }
})();
