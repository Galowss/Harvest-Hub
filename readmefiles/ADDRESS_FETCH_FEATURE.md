# 📍 Address Fetching Feature - Complete

## ✅ What's Been Added

### 1. **Automatic Address Fetching on GPS Location**
When a farmer clicks "Use My Current GPS Location", the system now:
- Gets their GPS coordinates
- **Automatically fetches the address** from OpenStreetMap
- Displays the full address (e.g., "Quezon City, Metro Manila, Philippines")

### 2. **Manual Address Fetch Button**
Added a "🔍 Fetch" button next to the address field:
- Enter lat/lng manually
- Click "Fetch" to get the address automatically
- No need to type the address manually!

### 3. **Address Display on Map**
Addresses now appear in:
- **Farmer cards** in the sidebar (below email)
- **Map popups** when clicking on farmer markers
- Format: `📫 [Full Address]`

### 4. **Bulk Address Fetcher Script**
Created `scripts/fetchAddresses.js` to fetch addresses for existing farmers:
- Automatically finds farmers with coordinates but no address
- Uses reverse geocoding to get addresses
- Updates Firestore with proper addresses

---

## 🚀 How to Use

### For Farmers Setting Their Location:

1. Go to `/dashboard/farmer/location`
2. Click **"Use My Current GPS Location"**
3. ✨ **Address is automatically fetched!**
4. Click "Save Location"

### For Manual Entry:

1. Enter Latitude and Longitude
2. Click the **"🔍 Fetch"** button next to address field
3. Address is automatically populated
4. Click "Save Location"

---

## 🔧 Fetch Addresses for Existing Farmers

If you already have farmers with coordinates but no addresses, run this in browser console:

```javascript
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
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const name = data.name || data.email;
      
      if (data.location?.lat && data.location?.lng && !data.location.address) {
        console.log(`📍 Fetching address for ${name}...`);
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.location.lat}&lon=${data.location.lng}`,
          { headers: { 'User-Agent': 'HarvestHub/1.0' } }
        );
        
        if (response.ok) {
          const geoData = await response.json();
          const addr = geoData.address || {};
          const address = [
            addr.city || addr.town || addr.village,
            addr.state || addr.province,
            addr.country
          ].filter(Boolean).join(', ');
          
          await updateDoc(doc(db, 'users', docSnap.id), {
            'location.address': address
          });
          
          console.log(`   ✅ ${name}: ${address}`);
          updated++;
          
          // Wait 1 second (OpenStreetMap rate limit)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`\n✅ Updated ${updated} farmers! Refresh the page.`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

---

## 🌍 Reverse Geocoding API

**Service Used:** OpenStreetMap Nominatim
- ✅ **Free** (no API key required)
- ✅ No credit card needed
- ✅ Works worldwide
- ⚠️ Rate limit: 1 request per second
- ✅ No sign-up required

**API Endpoint:**
```
https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}
```

---

## 📊 What You'll See

### Farmer Card (Sidebar):
```
🌾 Dale Lianne
   liaaaa@gmail.com
   📍 Olongapo City, Zambales, Philippines
   📦 5 products
   🔵 12.5 km
```

### Map Popup:
```
🌾 Dale Lianne
📫 Olongapo City, Zambales, Philippines
📍 12.5 km away
📦 5 products available

Top Products:
[Tomato] [Lettuce] [Carrot]

👁️ View Products
```

---

## ✨ Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Auto-fetch on GPS | ✅ | Gets address when using GPS location |
| Manual fetch button | ✅ | Fetch address from entered coordinates |
| Address in sidebar | ✅ | Shows in farmer cards |
| Address in map popup | ✅ | Shows when clicking markers |
| Bulk address fetcher | ✅ | Script to update existing farmers |
| No API key needed | ✅ | Uses free OpenStreetMap service |
| Rate limiting | ✅ | Respects 1 req/sec limit |

---

## 🎯 Next Steps

1. **Test the feature:**
   - Login as a farmer
   - Go to `/dashboard/farmer/location`
   - Click "Use My Current GPS Location"
   - Verify address is fetched automatically

2. **Update existing farmers:**
   - Run the bulk fetch script in browser console
   - Wait for all addresses to be fetched
   - Refresh the map page

3. **Verify on map:**
   - Check sidebar shows addresses
   - Click farmer markers
   - Verify popups show addresses

---

## 🐛 Troubleshooting

### Address not fetching?
- Check browser console for errors
- Verify internet connection
- Make sure coordinates are valid (Philippines: lat 5-19, lng 117-127)

### "Too Many Requests" error?
- Wait 1-2 seconds between requests
- OpenStreetMap limits to 1 request/second

### Address shows "Unknown Location"?
- Coordinates might be in ocean or remote area
- Try manual address entry

---

**All done! 🎉 Addresses are now automatically fetched and displayed throughout the map interface!**
