// PASTE THIS INTO BROWSER CONSOLE to fix farmer locations
// This moves lat/lng from root level into a location object

(async () => {
  const { db } = await import('./app/config/firebase.ts');
  const { collection, getDocs, query, where, updateDoc, doc, deleteField } = await import('firebase/firestore');
  
  console.log('🔧 Fixing farmer location structure...\n');
  
  const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
  const snapshot = await getDocs(farmersQuery);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = data.name || data.email;
    
    // Check if lat/lng are at root level (wrong structure)
    if (data.lat !== undefined && data.lng !== undefined) {
      const lat = typeof data.lat === 'string' ? parseFloat(data.lat) : data.lat;
      const lng = typeof data.lng === 'string' ? parseFloat(data.lng) : data.lng;
      const address = typeof data.location === 'string' ? data.location : '';
      
      if (!isNaN(lat) && !isNaN(lng)) {
        await updateDoc(doc(db, 'users', docSnap.id), {
          location: {
            lat: lat,
            lng: lng,
            address: address
          },
          lat: deleteField(),
          lng: deleteField()
        });
        
        console.log(`✅ Fixed ${name}: { lat: ${lat}, lng: ${lng}, address: "${address}" }`);
      }
    }
  }
  
  console.log('\n✅ Done! Refresh the map page now.');
})();
