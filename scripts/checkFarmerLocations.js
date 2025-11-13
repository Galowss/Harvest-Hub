// Quick script to check farmer locations in Firestore
// Run this in the browser console while logged into your app

const checkFarmerLocations = async () => {
  try {
    console.log('🔍 Checking farmer locations...\n');
    
    // Dynamic import from your Firebase config
    const { db } = await import('../app/config/firebase');
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
    const snapshot = await getDocs(farmersQuery);
    
    console.log(`📊 Found ${snapshot.docs.length} farmers total\n`);
    console.log('━'.repeat(60));
    
    let hasValidLocation = 0;
    let hasInvalidLocation = 0;
    let hasNoLocation = 0;
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const name = data.name || data.email;
      
      console.log(`\n${index + 1}. ${name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   UID: ${doc.id}`);
      
      if (!data.location) {
        console.log('   ❌ NO LOCATION DATA');
        hasNoLocation++;
      } else if (!data.location.lat || !data.location.lng) {
        console.log('   ❌ LOCATION INCOMPLETE');
        console.log('   Location:', data.location);
        hasInvalidLocation++;
      } else {
        const lat = data.location.lat;
        const lng = data.location.lng;
        const latType = typeof lat;
        const lngType = typeof lng;
        
        console.log(`   Location:`, data.location);
        console.log(`   Lat: ${lat} (${latType})`);
        console.log(`   Lng: ${lng} (${lngType})`);
        
        if (latType === 'string' || lngType === 'string') {
          console.log('   ⚠️ COORDINATES ARE STRINGS! (should be numbers)');
          hasInvalidLocation++;
        } else if (isNaN(lat) || isNaN(lng)) {
          console.log('   ❌ COORDINATES ARE NaN!');
          hasInvalidLocation++;
        } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.log('   ❌ COORDINATES OUT OF RANGE!');
          hasInvalidLocation++;
        } else {
          console.log('   ✅ VALID LOCATION');
          hasValidLocation++;
        }
      }
      
      console.log('   Products:', data.products?.length || 0);
    });
    
    console.log('\n' + '━'.repeat(60));
    console.log('\n📈 Summary:');
    console.log(`   ✅ Valid locations: ${hasValidLocation}`);
    console.log(`   ⚠️ Invalid locations: ${hasInvalidLocation}`);
    console.log(`   ❌ No locations: ${hasNoLocation}`);
    
    if (hasInvalidLocation > 0 || hasNoLocation > 0) {
      console.log('\n💡 Next steps:');
      if (hasNoLocation > 0) {
        console.log('   1. Have farmers visit: /dashboard/farmer/location');
        console.log('   2. Click "Use My Current GPS Location"');
        console.log('   3. Click "Save Location"');
      }
      if (hasInvalidLocation > 0) {
        console.log('   Run fixFarmerLocations() to convert string coordinates to numbers');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

const fixFarmerLocations = async () => {
  try {
    console.log('🔧 Fixing farmer locations...\n');
    
    const { db } = await import('../app/config/firebase');
    const { collection, getDocs, query, where, updateDoc, doc } = await import('firebase/firestore');
    
    const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
    const snapshot = await getDocs(farmersQuery);
    
    let fixed = 0;
    let skipped = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const name = data.name || data.email;
      
      if (data.location && data.location.lat && data.location.lng) {
        const lat = parseFloat(data.location.lat);
        const lng = parseFloat(data.location.lng);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          await updateDoc(doc(db, 'users', docSnap.id), {
            'location.lat': lat,
            'location.lng': lng
          });
          console.log(`✅ Fixed ${name}: lat=${lat}, lng=${lng}`);
          fixed++;
        } else {
          console.log(`⚠️ Skipped ${name}: invalid coordinates`);
          skipped++;
        }
      } else {
        console.log(`⚠️ Skipped ${name}: no location data`);
        skipped++;
      }
    }
    
    console.log(`\n✅ Fixed: ${fixed}`);
    console.log(`⚠️ Skipped: ${skipped}`);
    console.log('\nRefresh the map page to see changes!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

console.log('📋 Available commands:');
console.log('   checkFarmerLocations() - Check all farmer locations');
console.log('   fixFarmerLocations() - Convert string coordinates to numbers');
console.log('\nRun: checkFarmerLocations()');
