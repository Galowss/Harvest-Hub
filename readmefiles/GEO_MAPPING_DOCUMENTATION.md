# 🗺️ Geo-Mapping Integration Guide

## Overview
The Geo-Mapping feature helps users find nearby farmers, calculate delivery distances, and visualize farmer locations on an interactive Google Maps interface.

## Features Implemented

### 1. **Interactive Google Maps**
- Real-time farmer location markers
- User location tracking with GPS
- Distance lines between user and farmers
- Custom map markers with info windows
- Responsive map controls

### 2. **Distance Calculation**
- Haversine formula for accurate distance calculation
- Search radius filter (1-50 km)
- Sort by distance or product count
- Real-time distance updates

### 3. **Farmer Discovery**
- View all farmers within search radius
- Filter by distance and product availability
- Click markers to see farmer details
- Direct links to farmer products

### 4. **Location Features**
- Browser geolocation support
- Manual location updates
- Save location to user profile
- Fallback to default coordinates (Manila)

## Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API** (optional, for address autocomplete)
   - **Geocoding API** (optional, for address search)

4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key
6. **Important**: Restrict your API key:
   - Application restrictions: Set to "HTTP referrers"
   - Add your domain: `localhost:3000`, `yourdomain.com`
   - API restrictions: Select "Maps JavaScript API"

### Step 2: Add API Key to Project

Open `app/dashboard/map/MapComponent.tsx` and replace the placeholder:

```typescript
// Line 48 - Replace YOUR_GOOGLE_MAPS_API_KEY with your actual key
script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places`;
```

**Recommended**: Use environment variables for security:

1. Create `.env.local` file in root:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

2. Update MapComponent.tsx:
```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
```

3. Add `.env.local` to `.gitignore`:
```
.env.local
.env*.local
```

### Step 3: Add Farmer Locations to Firebase

Farmers need to set their locations. You can:

**Option A: Manual Update via Firebase Console**
```javascript
// Add location field to users collection
{
  role: "farmer",
  name: "Juan dela Cruz",
  location: {
    lat: 14.5995,
    lng: 120.9842,
    address: "Quezon City, Metro Manila"
  }
}
```

**Option B: Create Location Update Page**

Create `app/dashboard/farmer/location/page.tsx`:
```typescript
"use client";
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../config/firebase";

export default function UpdateLocation() {
  const [location, setLocation] = useState({ lat: 0, lng: 0 });

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  };

  const saveLocation = async () => {
    if (!auth.currentUser) return;
    
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      location,
    });
    
    alert("Location saved!");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Update Your Location</h1>
      <button onClick={getCurrentLocation} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
        Get Current Location
      </button>
      <p>Latitude: {location.lat}</p>
      <p>Longitude: {location.lng}</p>
      <button onClick={saveLocation} className="bg-green-600 text-white px-4 py-2 rounded mt-4">
        Save Location
      </button>
    </div>
  );
}
```

## Usage Guide

### For Users (Buyers)

1. Navigate to **Farmer Map** from dashboard
2. Allow browser location access when prompted
3. Adjust search radius using the slider
4. View nearby farmers on the map
5. Click farmer markers to see:
   - Farmer name and contact
   - Distance from your location
   - Available products
   - Direct link to product page
6. Use the sidebar to browse farmer details
7. Sort by distance or product count

### For Farmers

Farmers need to add their location to appear on the map:

1. Go to Firebase Console → Firestore Database
2. Find your user document in `users` collection
3. Add `location` field:
```json
{
  "location": {
    "lat": 14.5995,
    "lng": 120.9842,
    "address": "Your farm address"
  }
}
```

Or create a farmer location update page (see Step 3, Option B above).

## Features Breakdown

### Distance Calculation (Haversine Formula)
```typescript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};
```

### Map Customization

**Custom Marker Icons:**
```typescript
// User marker (blue circle)
icon: {
  path: google.maps.SymbolPath.CIRCLE,
  scale: 12,
  fillColor: "#4285F4",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 3,
}

// Farmer marker (green pin)
icon: {
  url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
  scaledSize: new google.maps.Size(40, 40),
}
```

**Distance Lines:**
```typescript
const line = new google.maps.Polyline({
  path: [userLocation, farmerLocation],
  geodesic: true,
  strokeColor: "#22c55e",
  strokeOpacity: 0.4,
  strokeWeight: 2,
});
```

## Firestore Data Structure

### User Collection (with location)
```javascript
{
  id: "user123",
  email: "farmer@example.com",
  role: "farmer",
  name: "Juan dela Cruz",
  location: {
    lat: 14.5995,
    lng: 120.9842,
    address: "123 Farm Road, Quezon City" // optional
  },
  createdAt: Timestamp
}
```

## Benefits

### 1. **Reduced Delivery Costs**
- Users can find the nearest farmers
- Shorter distances = lower delivery fees
- Optimize delivery routes

### 2. **Better User Experience**
- Visual representation of farmer locations
- Easy distance comparison
- Quick access to nearby products

### 3. **Increased Farmer Visibility**
- Local farmers appear first in search
- Proximity-based marketing
- Better customer targeting

### 4. **Delivery Planning**
- Calculate accurate delivery distances
- Estimate delivery times
- Plan efficient routes

## Advanced Features (Future Enhancements)

### 1. **Route Optimization**
```typescript
// Use Google Directions API for actual routes
const directionsService = new google.maps.DirectionsService();
directionsService.route({
  origin: userLocation,
  destination: farmerLocation,
  travelMode: google.maps.TravelMode.DRIVING,
}, (result, status) => {
  // Display route on map
});
```

### 2. **Delivery Zones**
```typescript
// Draw delivery radius circles
const deliveryZone = new google.maps.Circle({
  center: farmerLocation,
  radius: 5000, // 5km radius
  fillColor: "#22c55e",
  fillOpacity: 0.1,
  strokeColor: "#22c55e",
  strokeWeight: 1,
});
```

### 3. **Address Autocomplete**
```typescript
// Use Places Autocomplete for address search
const autocomplete = new google.maps.places.Autocomplete(inputElement);
autocomplete.addListener('place_changed', () => {
  const place = autocomplete.getPlace();
  // Use place.geometry.location
});
```

### 4. **Clustering for Many Farmers**
```typescript
// Use MarkerClusterer for better performance
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const markerClusterer = new MarkerClusterer({
  map,
  markers: farmerMarkers,
});
```

## Troubleshooting

### Map Not Loading
- Check if API key is valid
- Verify API restrictions allow your domain
- Check browser console for errors
- Ensure Maps JavaScript API is enabled

### Location Not Working
- Check browser permissions for geolocation
- Use HTTPS (geolocation requires secure context)
- Provide manual location input option
- Use fallback coordinates

### Markers Not Appearing
- Verify farmer has `location` field in Firestore
- Check if location has valid lat/lng values
- Ensure markers are within map bounds
- Check console for JavaScript errors

### Performance Issues
- Use marker clustering for 50+ farmers
- Limit visible markers by zoom level
- Lazy load farmer details
- Optimize Firestore queries

## API Costs

Google Maps Platform has a free tier:
- **$200 free credits per month**
- Maps JavaScript API: $7 per 1,000 loads
- First 28,500 loads free per month

**Cost Optimization:**
- Cache map tiles
- Limit API calls
- Use static maps for thumbnails
- Set daily quotas

## Testing

### Test with Sample Data

Add test farmers to Firestore:
```javascript
// Metro Manila locations
const testFarmers = [
  { name: "Farmer 1", location: { lat: 14.5995, lng: 120.9842 } }, // Quezon City
  { name: "Farmer 2", location: { lat: 14.5547, lng: 121.0244 } }, // Mandaluyong
  { name: "Farmer 3", location: { lat: 14.6760, lng: 121.0437 } }, // Marikina
];
```

### Testing Checklist
- [ ] Map loads correctly
- [ ] User location detected
- [ ] Farmer markers appear
- [ ] Info windows show correct data
- [ ] Distance calculation accurate
- [ ] Filters work properly
- [ ] Mobile responsive
- [ ] Click-through to products works

## Next Steps

1. **Add API Key** - Get and configure Google Maps API key
2. **Add Farmer Locations** - Update farmer profiles with GPS coordinates
3. **Test Map** - Navigate to `/dashboard/map` and test functionality
4. **Optimize Performance** - Add clustering if needed
5. **Add Address Search** - Implement Places autocomplete
6. **Integrate with Orders** - Calculate delivery fees based on distance

## Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Maps Pricing](https://mapsplatform.google.com/pricing/)
- [Marker Clustering](https://developers.google.com/maps/documentation/javascript/marker-clustering)
- [Places Autocomplete](https://developers.google.com/maps/documentation/javascript/place-autocomplete)

---

**Status**: ✅ Map component ready, needs API key configuration
**Priority**: High - Enhances user experience and reduces delivery costs
**Dependencies**: Google Maps API key, farmer location data
