// Script to fetch addresses for farmers who have coordinates but no address
// Paste this in browser console on /dashboard/map page

(async () => {
  try {
    const firebaseModule = await import('../../config/firebase.ts');
    const firestoreModule = await import('firebase/firestore');
    
    const { db } = firebaseModule;
    const { collection, getDocs, query, where, updateDoc, doc } = firestoreModule;
    
    console.log('🔍 Fetching addresses for farmers...\n');
    
    const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
    const snapshot = await getDocs(farmersQuery);
    
    let updated = 0;
    let skipped = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const name = data.name || data.email;
      
      // Check if farmer has location with coordinates but no address
      if (data.location?.lat && data.location?.lng) {
        const hasAddress = data.location.address && data.location.address !== '';
        
        if (!hasAddress) {
          console.log(`📍 Fetching address for ${name}...`);
          
          try {
            // Reverse geocoding using OpenStreetMap Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.location.lat}&lon=${data.location.lng}&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'HarvestHub/1.0'
                }
              }
            );
            
            if (response.ok) {
              const geoData = await response.json();
              
              // Extract readable address
              const addr = geoData.address || {};
              const addressParts = [
                addr.city || addr.town || addr.village || addr.municipality,
                addr.state || addr.province,
                addr.country
              ].filter(Boolean);
              
              const address = addressParts.length > 0 
                ? addressParts.join(', ') 
                : geoData.display_name;
              
              // Update Firestore
              await updateDoc(doc(db, 'users', docSnap.id), {
                'location.address': address
              });
              
              console.log(`   ✅ ${name}: ${address}`);
              updated++;
              
              // Rate limiting: wait 1 second between requests (Nominatim requirement)
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.log(`   ⚠️ ${name}: Could not fetch address`);
              skipped++;
            }
          } catch (error) {
            console.error(`   ❌ ${name}: Error -`, error);
            skipped++;
          }
        } else {
          console.log(`✅ ${name}: Already has address - "${data.location.address}"`);
          skipped++;
        }
      } else {
        console.log(`⚠️ ${name}: No location coordinates`);
        skipped++;
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   ✅ Addresses fetched: ${updated}`);
    console.log(`   ⏭️ Skipped: ${skipped}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (updated > 0) {
      console.log('\n🔄 Refresh the page to see updated addresses!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
