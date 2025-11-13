// Debug script: Check all farmers and their location/address data
// Paste this in browser console on /dashboard/map page

(async () => {
  try {
    const firebaseModule = await import('../../config/firebase.ts');
    const firestoreModule = await import('firebase/firestore');
    
    const { db } = firebaseModule;
    const { collection, getDocs, query, where } = firestoreModule;
    
    console.log('🔍 Checking ALL farmers in database...\n');
    console.log('━'.repeat(80));
    
    const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
    const snapshot = await getDocs(farmersQuery);
    
    console.log(`\n📊 Total farmers: ${snapshot.docs.length}\n`);
    
    let withLocation = 0;
    let withAddress = 0;
    let withoutLocation = 0;
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const name = data.name || data.email || 'Unnamed';
      
      console.log(`\n${index + 1}. 👨‍🌾 ${name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   UID: ${doc.id}`);
      
      // Check address field (separate from location)
      if (data.address) {
        console.log(`   📫 Address field: "${data.address}"`);
      }
      
      // Check contact
      if (data.contact) {
        console.log(`   📞 Contact: ${data.contact}`);
      }
      
      // Check location object
      if (data.location && typeof data.location === 'object' && data.location.lat && data.location.lng) {
        console.log(`   ✅ Location: { lat: ${data.location.lat}, lng: ${data.location.lng} }`);
        if (data.location.address) {
          console.log(`   📍 Location Address: "${data.location.address}"`);
          withAddress++;
        }
        withLocation++;
      } else if (data.location) {
        console.log(`   ⚠️ Location field exists but invalid:`, data.location);
        withoutLocation++;
      } else {
        console.log(`   ❌ NO LOCATION DATA`);
        withoutLocation++;
      }
      
      // Check lat/lng at root (old structure)
      if (data.lat !== undefined || data.lng !== undefined) {
        console.log(`   ⚠️ OLD STRUCTURE: lat/lng at root level!`);
        console.log(`   lat: ${data.lat}, lng: ${data.lng}`);
      }
      
      // Check products count
      console.log(`   📦 Products: ${data.products?.length || 0}`);
    });
    
    console.log('\n' + '━'.repeat(80));
    console.log('\n📈 Summary:');
    console.log(`   ✅ Farmers with valid location: ${withLocation}`);
    console.log(`   📫 Farmers with address in location: ${withAddress}`);
    console.log(`   ❌ Farmers without location: ${withoutLocation}`);
    console.log(`   📊 Total: ${snapshot.docs.length}`);
    
    console.log('\n💡 Recommendations:');
    if (withoutLocation > 0) {
      console.log(`   • ${withoutLocation} farmer(s) need to set their location`);
      console.log(`   • Have them visit: /dashboard/farmer/location`);
    }
    if (withLocation - withAddress > 0) {
      console.log(`   • ${withLocation - withAddress} farmer(s) have location but no address`);
      console.log(`   • Run fetchAddresses.js script to auto-fetch addresses`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
