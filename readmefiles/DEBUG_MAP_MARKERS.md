# 🔍 Debug: Farmers Not Showing on Map

## Current Issue
- Map loads correctly ✅
- Blue marker (your location) shows ✅  
- Farmers appear in sidebar (Dale Lianne, Galo bels) ✅
- **BUT: Green farmer pins NOT showing on map** ❌
- Distance shows "NaN km" ❌

---

## Debugging Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) and look for these logs:

```
✅ Total farmers fetched: X
📍 Farmers with locations: X
📍 Farmer loaded: { name, hasLocation, location, productsCount }
🗺️ Rendering map with: { userLocation, farmersCount, farmers }
🗺️ Adding X farmers to map
✅ Adding marker for [name] at { lat, lng }
```

**What to check:**
- Are farmers being fetched?
- Do they have locations?
- Are locations valid numbers?
- Are markers being added to map?

---

### Step 2: Verify Firestore Data Structure

Go to Firebase Console → Firestore → `users` collection

Find a farmer document and verify it looks like this:

```json
{
  "uid": "abc123",
  "email": "farmer@example.com",
  "role": "farmer",
  "name": "Dale Lianne",
  "location": {
    "lat": 14.5995,    ← Must be NUMBER, not string!
    "lng": 120.9842,   ← Must be NUMBER, not string!
    "address": "Quezon City"
  }
}
```

**Common Issues:**
- ❌ `lat` and `lng` stored as **strings** ("14.5995" instead of 14.5995)
- ❌ `location` field missing
- ❌ `location` field is empty object `{}`
- ❌ Wrong field names (`latitude`/`longitude` instead of `lat`/`lng`)

---

### Step 3: Fix String Coordinates

If coordinates are stored as strings, they need to be converted to numbers.

**Quick Fix in Firebase Console:**
1. Click on the farmer document
2. Click on `location.lat` field
3. Change type from "string" to "number"
4. Do the same for `location.lng`
5. Click Update

**Or run this in browser console on your app:**

```javascript
// Copy and paste this into browser console while logged in as admin
const fixFarmerLocations = async () => {
  const { db } = await import('./app/config/firebase');
  const { collection, getDocs, query, where, updateDoc, doc } = await import('firebase/firestore');
  
  const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
  const snapshot = await getDocs(farmersQuery);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.location && data.location.lat && data.location.lng) {
      const lat = parseFloat(data.location.lat);
      const lng = parseFloat(data.location.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        await updateDoc(doc(db, 'users', docSnap.id), {
          location: {
            lat: lat,
            lng: lng,
            address: data.location.address || ''
          }
        });
        console.log(`✅ Fixed ${data.name || data.email}`);
      }
    }
  }
  console.log('Done!');
};

fixFarmerLocations();
```

---

### Step 4: Add Test Locations Manually

If farmers don't have locations, add them via Firebase Console:

**For Dale Lianne:**
1. Go to Firebase Console → Firestore
2. Find `users` → Dale Lianne's document (email: ilaaaa@gmail.com)
3. Add field:
   - Field: `location`
   - Type: `map`
   - Add subfields:
     - `lat` (number): `14.5995`
     - `lng` (number): `120.9842`
     - `address` (string): `"Quezon City, Metro Manila"`
4. Click Update

**For Galo bels:**
1. Find document (email: galo@gmail.com)
2. Add field:
   - Field: `location`
   - Type: `map`
   - Subfields:
     - `lat` (number): `14.6760`
     - `lng` (number): `121.0437`
     - `address` (string): `"Marikina City, Metro Manila"`

---

### Step 5: Use the Location Setup Page

**Easiest method:**

1. **Logout** from current session
2. **Login as farmer** (Dale Lianne or Galo bels)
3. Go to: `http://localhost:3001/dashboard/farmer/location`
4. Click **"Use My Current GPS Location"**
5. Click **"Save Location"**
6. Logout and login as regular user
7. Go to map - farmer should now appear!

---

## Common Issues & Solutions

### Issue 1: "NaN km" in sidebar
**Cause:** Coordinates are strings or undefined  
**Fix:** Convert to numbers (see Step 3)

### Issue 2: Markers not rendering
**Cause:** Leaflet not adding markers to map  
**Fix:** Check browser console for Leaflet errors

### Issue 3: Farmers filtered out
**Cause:** Distance calculation returns Infinity or NaN  
**Fix:** Ensure both user and farmer have valid numeric coordinates

### Issue 4: Search radius too small
**Cause:** Farmers outside 10km radius  
**Fix:** Increase search radius slider to 50km

---

## Expected Console Output

When everything works correctly, you should see:

```
✅ Total farmers fetched: 3
📍 Farmers with locations: 3
📍 Farmer loaded: { name: "Dale Lianne", hasLocation: true, location: {lat: 14.5995, lng: 120.9842}, productsCount: 0 }
📍 Farmer loaded: { name: "Galo bels", hasLocation: true, location: {lat: 14.6760, lng: 121.0437}, productsCount: 1 }
📏 Calculating distance for Dale Lianne
📏 Distance to Dale Lianne: 0.25 km
📏 Calculating distance for Galo bels  
📏 Distance to Galo bels: 8.5 km
🗺️ Rendering map with: { userLocation: {lat: 14.5995, lng: 120.9842}, farmersCount: 3 }
🗺️ Adding 3 farmers to map
✅ Adding marker for Dale Lianne at {lat: 14.5995, lng: 120.9842}
✅ Adding marker for Galo bels at {lat: 14.6760, lng: 121.0437}
```

---

## Quick Test Script

Run this in browser console to check farmer data:

```javascript
// Check current farmers data
const checkFarmers = async () => {
  const { db, auth } = await import('./app/config/firebase');
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  
  const farmersQuery = query(collection(db, 'users'), where('role', '==', 'farmer'));
  const snapshot = await getDocs(farmersQuery);
  
  console.log(`Found ${snapshot.docs.length} farmers:`);
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log('---');
    console.log('Name:', data.name || data.email);
    console.log('Email:', data.email);
    console.log('Has location?', !!data.location);
    if (data.location) {
      console.log('Location:', data.location);
      console.log('Lat type:', typeof data.location.lat);
      console.log('Lng type:', typeof data.location.lng);
      console.log('Lat value:', data.location.lat);
      console.log('Lng value:', data.location.lng);
    }
  });
};

checkFarmers();
```

---

## Next Steps

1. ✅ Open browser console (F12)
2. ✅ Check for error messages
3. ✅ Look for the debug logs added
4. ✅ Verify Firestore data structure
5. ✅ Fix string coordinates if needed
6. ✅ Add locations if missing
7. ✅ Refresh map page
8. ✅ See green farmer pins! 🟢

---

**Most likely issue:** Coordinates stored as strings instead of numbers in Firestore!

**Quick fix:** Use the location setup page (`/dashboard/farmer/location`) for each farmer.
