// Quick check: Are all farmers' locations properly migrated?
// Paste this in browser console

(async () => {
  const { db } = await import('./app/config/firebase.ts');
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  
  console.log('🔍 Checking ALL farmers in Firestore...\n');
  console.log('━'.repeat(80));
  
  const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
  const snapshot = await getDocs(farmersQuery);
  
  console.log(`\n📊 Total farmers found: ${snapshot.docs.length}\n`);
  
  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    const name = data.name || data.email || 'Unnamed';
    
    console.log(`\n${index + 1}. 👨‍🌾 ${name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Role: ${data.role}`);
    
    // Check old structure (lat/lng at root)
    if (data.lat !== undefined || data.lng !== undefined) {
      console.log('   ❌ OLD STRUCTURE DETECTED!');
      console.log(`   lat (root): ${data.lat} (${typeof data.lat})`);
      console.log(`   lng (root): ${data.lng} (${typeof data.lng})`);
    }
    
    // Check new structure (location object)
    if (data.location) {
      if (typeof data.location === 'object' && data.location.lat && data.location.lng) {
        const lat = data.location.lat;
        const lng = data.location.lng;
        const latValid = typeof lat === 'number' && !isNaN(lat);
        const lngValid = typeof lng === 'number' && !isNaN(lng);
        
        if (latValid && lngValid) {
          console.log('   ✅ VALID LOCATION OBJECT');
          console.log(`   location.lat: ${lat} (${typeof lat})`);
          console.log(`   location.lng: ${lng} (${typeof lng})`);
          console.log(`   location.address: "${data.location.address || 'N/A'}"`);
        } else {
          console.log('   ⚠️ LOCATION OBJECT EXISTS BUT INVALID');
          console.log(`   location.lat: ${lat} (${typeof lat}) - Valid: ${latValid}`);
          console.log(`   location.lng: ${lng} (${typeof lng}) - Valid: ${lngValid}`);
        }
      } else if (typeof data.location === 'string') {
        console.log('   ❌ location is a STRING, not an object!');
        console.log(`   location: "${data.location}"`);
      } else {
        console.log('   ❌ location exists but is not valid');
        console.log('   location:', data.location);
      }
    } else {
      console.log('   ❌ NO LOCATION DATA');
    }
    
    // Products count
    console.log(`   Products: ${data.products?.length || 0}`);
  });
  
  console.log('\n' + '━'.repeat(80));
  console.log('\n💡 Next steps:');
  console.log('   1. If any farmers show "OLD STRUCTURE" or "STRING", run the fix script again');
  console.log('   2. If any farmers show "NO LOCATION", have them visit /dashboard/farmer/location');
  console.log('   3. Farmers with "VALID LOCATION" should appear on the map');
  
})();
