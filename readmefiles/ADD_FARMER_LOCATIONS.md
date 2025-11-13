# 📍 Quick Setup: Add Farmer Locations

## Method 1: Via Firebase Console (Recommended)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com
2. Select your HarvestHub project
3. Click **Firestore Database** in left menu

### Step 2: Find Farmer Users
1. Click on **users** collection
2. Look for documents where `role = "farmer"`
3. Click on each farmer document

### Step 3: Add Location Field
For each farmer, add a new field:

**Field Setup:**
- **Field name:** `location`
- **Type:** `map`
- **Subfields:**
  - `lat` (number): Latitude coordinate
  - `lng` (number): Longitude coordinate
  - `address` (string, optional): Full address

### Step 4: Use These Sample Locations

Copy and paste these Metro Manila coordinates for your test farmers:

#### Farmer 1 - Quezon City
```
location: {
  lat: 14.5995
  lng: 120.9842
  address: "Quezon City, Metro Manila"
}
```

#### Farmer 2 - Mandaluyong
```
location: {
  lat: 14.5547
  lng: 121.0244
  address: "Mandaluyong City, Metro Manila"
}
```

#### Farmer 3 - Marikina
```
location: {
  lat: 14.6760
  lng: 121.0437
  address: "Marikina City, Metro Manila"
}
```

#### Farmer 4 - Pasig
```
location: {
  lat: 14.5243
  lng: 121.0792
  address: "Pasig City, Metro Manila"
}
```

#### Farmer 5 - Makati
```
location: {
  lat: 14.5547
  lng: 121.0244
  address: "Makati City, Metro Manila"
}
```

---

## Method 2: Create Farmers with Locations (Signup New)

If you don't have farmers yet, create them:

1. **Sign up as farmer**: `/signup/farmer`
2. **Then manually add location** via Firebase Console (Method 1 above)

---

## Method 3: Quick Test Script (Developer)

Create a Node.js script to add locations automatically:

**File: `scripts/add-farmer-locations.js`**

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const farmerLocations = [
  { lat: 14.5995, lng: 120.9842, address: "Quezon City, Metro Manila" },
  { lat: 14.5547, lng: 121.0244, address: "Mandaluyong City, Metro Manila" },
  { lat: 14.6760, lng: 121.0437, address: "Marikina City, Metro Manila" },
  { lat: 14.5243, lng: 121.0792, address: "Pasig City, Metro Manila" },
  { lat: 14.5547, lng: 121.0244, address: "Makati City, Metro Manila" },
];

async function addLocations() {
  const farmersSnapshot = await db.collection('users')
    .where('role', '==', 'farmer')
    .get();
  
  const farmers = farmersSnapshot.docs;
  console.log(`Found ${farmers.length} farmers`);
  
  for (let i = 0; i < farmers.length && i < farmerLocations.length; i++) {
    const farmerDoc = farmers[i];
    const location = farmerLocations[i];
    
    await farmerDoc.ref.update({ location });
    console.log(`✅ Added location to farmer: ${farmerDoc.data().email}`);
  }
  
  console.log('Done!');
  process.exit(0);
}

addLocations().catch(console.error);
```

**Run it:**
```bash
node scripts/add-farmer-locations.js
```

---

## Method 4: Quick Manual Addition (Current Session)

If you're logged into Firebase Console right now:

1. **Click on Firestore Database**
2. **Find a farmer user document**
3. **Click "Add field"**
4. Enter these exactly:

```
Field: location
Type: map

Then add nested fields:
├─ lat (number): 14.5995
├─ lng (number): 120.9842
└─ address (string): "Quezon City"
```

5. **Click Update**
6. **Refresh your map page** (`/dashboard/map`)

---

## Verification Steps

After adding locations:

1. **Go to**: `http://localhost:3000/dashboard/map`
2. **You should see**:
   - ✅ Blue circle marker (your location)
   - ✅ Green pin markers with 🌾 emoji (farmers)
   - ✅ Dashed green lines connecting you to farmers
   - ✅ Distance calculations (e.g., "5.2 km away")
3. **Click on green markers**:
   - ✅ Popup shows farmer info
   - ✅ Shows products available
   - ✅ "View Products" button works

---

## 🗺️ Understanding Coordinates

### Latitude (lat):
- North-South position
- Philippines: ~5° to 19° North
- Metro Manila: ~14.4° to 14.8°

### Longitude (lng):
- East-West position
- Philippines: ~117° to 127° East
- Metro Manila: ~120.9° to 121.1°

### Getting Real Coordinates:

**Option A: Google Maps**
1. Right-click any location on Google Maps
2. Select "What's here?"
3. Copy the coordinates shown

**Option B: Get from Browser**
1. Go to `/dashboard/map`
2. Allow location permission
3. Check browser console
4. You'll see your current coordinates logged

**Option C: Use GPS Coordinate Finder**
- Visit: https://www.latlong.net/
- Search for any address
- Copy coordinates

---

## 📊 Sample Data Structure

After adding locations, your farmer document should look like:

```json
{
  "uid": "farmer123",
  "email": "farmer@example.com",
  "role": "farmer",
  "name": "Juan dela Cruz",
  "location": {
    "lat": 14.5995,
    "lng": 120.9842,
    "address": "Quezon City, Metro Manila"
  },
  "createdAt": "2025-11-13T10:30:00Z"
}
```

---

## 🚨 Common Issues

### Issue: Farmers don't appear on map
**Check:**
- [ ] Farmer has `location` field
- [ ] `lat` and `lng` are numbers (not strings)
- [ ] Coordinates are valid (lat: 14.x, lng: 120.x for Manila)
- [ ] Farmer is within search radius (adjust slider)

### Issue: Map shows but no markers
**Check:**
- [ ] At least one farmer has products added
- [ ] Location permission granted
- [ ] Browser console for errors
- [ ] Firestore security rules allow read

### Issue: Can't see own location
**Fix:**
- Allow browser location permission
- Use HTTPS or localhost
- Default fallback: Manila (14.5995, 120.9842)

---

## 🎯 Quick Test Checklist

- [ ] Added location to at least 1 farmer
- [ ] Farmer has at least 1 product
- [ ] Refreshed the map page
- [ ] Allowed location permission
- [ ] See green farmer markers
- [ ] Click marker shows popup
- [ ] Distance calculated correctly
- [ ] Lines drawn between locations

---

## 🌟 Pro Tips

### Realistic Spacing:
- Keep farmers 2-20 km apart for realistic testing
- Use different cities in Metro Manila
- Vary distances to test sorting

### Product Testing:
- Farmers with products show in list
- Farmers without products are hidden
- Add products first, then locations

### Distance Testing:
- Adjust search radius: 1-50 km
- Sort by distance to see closest first
- Sort by products to see most inventory

---

## 📍 More Sample Locations

### Provincial Locations (if needed):

**Cavite:**
```
lat: 14.2456, lng: 120.8792
```

**Laguna:**
```
lat: 14.2691, lng: 121.4113
```

**Rizal:**
```
lat: 14.6037, lng: 121.3084
```

**Bulacan:**
```
lat: 14.7942, lng: 120.8806
```

**Pampanga:**
```
lat: 15.0794, lng: 120.6200
```

---

## ✅ Success!

After adding locations, your map should display:

```
Your Location (Blue Marker)
    |
    ├─ Farmer 1 (Green Pin) - 5.2 km
    ├─ Farmer 2 (Green Pin) - 8.7 km  
    ├─ Farmer 3 (Green Pin) - 12.4 km
    └─ Farmer 4 (Green Pin) - 15.9 km
```

Click any green pin to see farmer details! 🎉

---

**Next**: Test all features in `SETUP_CHECKLIST.md`
**Help**: See `LEAFLET_MAP_READY.md` for troubleshooting
