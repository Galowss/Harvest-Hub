// Migration script to fix farmer location data structure
// This moves lat/lng from root level into a location object

import { db } from '../app/config/firebase';
import { collection, getDocs, query, where, updateDoc, doc, deleteField } from 'firebase/firestore';

const migrateFarmerLocations = async () => {
  try {
    console.log('🔧 Starting location data migration...\n');
    
    const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
    const snapshot = await getDocs(farmersQuery);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const name = data.name || data.email;
      
      // Check if lat/lng are at root level (incorrect structure)
      if (data.lat !== undefined && data.lng !== undefined) {
        const lat = typeof data.lat === 'string' ? parseFloat(data.lat) : data.lat;
        const lng = typeof data.lng === 'string' ? parseFloat(data.lng) : data.lng;
        const address = typeof data.location === 'string' ? data.location : '';
        
        if (!isNaN(lat) && !isNaN(lng)) {
          // Create the new location object
          const newLocation = {
            lat: lat,
            lng: lng,
            address: address
          };
          
          // Update document: add location object, remove old fields
          await updateDoc(doc(db, 'users', docSnap.id), {
            location: newLocation,
            lat: deleteField(),
            lng: deleteField()
          });
          
          console.log(`✅ Migrated ${name}:`);
          console.log(`   Old: lat=${data.lat}, lng=${data.lng}, location="${data.location}"`);
          console.log(`   New: location={ lat: ${lat}, lng: ${lng}, address: "${address}" }\n`);
          migrated++;
        } else {
          console.log(`⚠️ Skipped ${name}: Invalid coordinates (lat=${data.lat}, lng=${data.lng})\n`);
          skipped++;
        }
      } else if (data.location && typeof data.location === 'object') {
        console.log(`✅ ${name} already has correct structure\n`);
        skipped++;
      } else {
        console.log(`⚠️ Skipped ${name}: No location data found\n`);
        skipped++;
      }
    }
    
    console.log('━'.repeat(60));
    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated} farmers`);
    console.log(`   Skipped: ${skipped} farmers`);
    console.log('\n🗺️ Refresh the map page to see farmers appear!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
};

// Export for use
export { migrateFarmerLocations };

// If running directly in browser console:
if (typeof window !== 'undefined') {
  (window as any).migrateFarmerLocations = migrateFarmerLocations;
  console.log('📋 Run: migrateFarmerLocations()');
}
