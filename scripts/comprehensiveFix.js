// COMPREHENSIVE FIX: Migrate ALL farmers to correct location structure
// Paste this in browser console while on the map page

(async () => {
  const { db } = await import('./app/config/firebase.ts');
  const { collection, getDocs, query, where, updateDoc, doc, deleteField } = await import('firebase/firestore');
  
  console.log('🔧 COMPREHENSIVE LOCATION MIGRATION\n');
  console.log('━'.repeat(80));
  
  const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
  const snapshot = await getDocs(farmersQuery);
  
  let fixed = 0;
  let alreadyCorrect = 0;
  let noData = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || data.email || 'Unnamed';
    
    console.log(`\n👨‍🌾 Processing: ${name}`);
    
    // Case 1: Old structure - lat/lng at root level
    if (data.lat !== undefined && data.lng !== undefined) {
      const lat = typeof data.lat === 'string' ? parseFloat(data.lat) : data.lat;
      const lng = typeof data.lng === 'string' ? parseFloat(data.lng) : data.lng;
      const address = typeof data.location === 'string' ? data.location : '';
      
      if (!isNaN(lat) && !isNaN(lng)) {
        await updateDoc(doc(db, 'users', docSnap.id), {
          location: { lat, lng, address },
          lat: deleteField(),
          lng: deleteField()
        });
        console.log(`   ✅ Migrated from old structure`);
        console.log(`   New location: { lat: ${lat}, lng: ${lng}, address: "${address}" }`);
        fixed++;
      } else {
        console.log(`   ❌ Invalid coordinates: lat=${data.lat}, lng=${data.lng}`);
        noData++;
      }
    }
    // Case 2: location is a string (should be object)
    else if (data.location && typeof data.location === 'string') {
      console.log(`   ⚠️ Location is a string: "${data.location}"`);
      console.log(`   → Needs to set location via /dashboard/farmer/location`);
      noData++;
    }
    // Case 3: location object exists - verify it's correct
    else if (data.location && typeof data.location === 'object') {
      const lat = data.location.lat;
      const lng = data.location.lng;
      
      // Check if coordinates are strings
      if (typeof lat === 'string' || typeof lng === 'string') {
        const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
        const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
        
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          await updateDoc(doc(db, 'users', docSnap.id), {
            'location.lat': latNum,
            'location.lng': lngNum
          });
          console.log(`   ✅ Converted string coordinates to numbers`);
          console.log(`   Location: { lat: ${latNum}, lng: ${lngNum} }`);
          fixed++;
        } else {
          console.log(`   ❌ Invalid string coordinates: lat="${lat}", lng="${lng}"`);
          noData++;
        }
      }
      // Check if coordinates are valid numbers
      else if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        console.log(`   ✅ Already correct structure`);
        console.log(`   Location: { lat: ${lat}, lng: ${lng}, address: "${data.location.address || 'N/A'}" }`);
        alreadyCorrect++;
      } else {
        console.log(`   ❌ Location object exists but invalid`);
        console.log(`   lat: ${lat} (${typeof lat}), lng: ${lng} (${typeof lng})`);
        noData++;
      }
    }
    // Case 4: No location data at all
    else {
      console.log(`   ❌ No location data found`);
      console.log(`   → Have farmer visit /dashboard/farmer/location to set location`);
      noData++;
    }
  }
  
  console.log('\n' + '━'.repeat(80));
  console.log('\n📊 MIGRATION SUMMARY:');
  console.log(`   ✅ Fixed/Migrated: ${fixed}`);
  console.log(`   ✅ Already correct: ${alreadyCorrect}`);
  console.log(`   ❌ No valid data: ${noData}`);
  console.log(`   📝 Total farmers: ${snapshot.docs.length}`);
  
  if (fixed > 0) {
    console.log('\n🎉 Migration successful!');
    console.log('   → Refresh the page to see all farmers on the map');
  }
  
  if (noData > 0) {
    console.log('\n💡 Action needed:');
    console.log('   → Have farmers without locations visit: /dashboard/farmer/location');
  }
  
})();
