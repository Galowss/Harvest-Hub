# Delivery Location Feature with Interactive Map

This document describes the delivery location pinpointing feature using Leaflet maps.

## Overview

Buyers can now pin their exact delivery location on an interactive map when placing orders. The system automatically converts coordinates to human-readable addresses using OpenStreetMap's Nominatim geocoding service.

## Features

### 📍 Interactive Map
- **Click to Pin**: Click anywhere on the map to set delivery location
- **Drag Marker**: Drag the marker to adjust the exact location
- **Auto-Location**: Automatically detects and centers on user's current location (with permission)

### 🗺️ Address Management
- **Reverse Geocoding**: Automatically converts coordinates to readable addresses
- **Auto-Fill**: Address field is automatically populated when location is selected
- **Manual Entry**: Users can also type their address manually
- **Address Preview**: Shows selected location in a clear, readable format

### 💾 Data Storage
Each delivery order stores:
- `deliveryAddress` - Human-readable address (string)
- `deliveryLocation` - Coordinates object `{ lat: number, lng: number }`
- `deliveryOption` - "delivery" or "pickup"
- `requiresDelivery` - Boolean flag

## User Experience

### For Buyers

1. **Order Summary Page**:
   - Select "Delivery" option
   - Enter address manually OR click "Pin Location on Map"
   - Map opens showing current location (if permitted)
   - Click or drag marker to set exact delivery spot
   - Address auto-fills from selected location
   - Review the complete address before placing order

2. **Display Format**:
   ```
   📍 Selected Location:
   123 Main Street, Barangay Example, Manila, Metro Manila, Philippines
   Coordinates: 14.599500, 120.984200
   ```

### For Farmers

1. **Order Management**:
   - View delivery address for each order
   - See exact coordinates for navigation
   - Can copy address for mapping apps
   - Track delivery status

## Technical Implementation

### Components

1. **LocationPicker Component**
   - File: `app/dashboard/user/order-summary/LocationPicker.tsx`
   - Dynamic import to prevent SSR issues
   - Uses react-leaflet library
   - Integrates OpenStreetMap tiles (free)

2. **Order Summary Page**
   - File: `app/dashboard/user/order-summary/page.tsx`
   - Manages delivery/pickup selection
   - Handles location state
   - Validates required fields

### Dependencies

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0",
  "@types/leaflet": "^1.9.20"
}
```

All dependencies are already installed - **no additional packages needed**.

### APIs Used

**OpenStreetMap Nominatim** (Free, No API Key Required)
- Reverse Geocoding: `https://nominatim.openstreetmap.org/reverse`
- Converts coordinates to addresses
- Usage Policy: Fair use (max ~1 request/second)

**OpenStreetMap Tiles** (Free)
- Map display: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- No API key required
- Attribution required (automatically included)

## Data Structure

### Order Document (Delivery)
```typescript
{
  buyerId: string,
  farmerId: string,
  productId: string,
  name: string,
  price: number,
  quantity: number,
  photo: string,
  status: "pending" | "out-for-delivery" | "completed" | "cancelled",
  createdAt: Date,
  deliveryOption: "delivery",
  deliveryAddress: string,          // "123 Main St, Manila, Philippines"
  deliveryLocation: {               // Optional but recommended
    lat: number,                    // 14.599500
    lng: number                     // 120.984200
  },
  requiresDelivery: true
}
```

### Order Document (Pickup)
```typescript
{
  // ... same base fields
  deliveryOption: "pickup",
  pickupDate: string,               // "2025-10-25"
  pickupTime: string,               // "14:30"
  pickupDateTime: Date,
  requiresDelivery: false
}
```

## Display Examples

### Order Summary (Before Placing Order)
```
📍 Selected Location:
Roxas Boulevard, Malate, Manila, Metro Manila, 1004, Philippines
Coordinates: 14.575900, 120.983200
```

### Farmer's Order View
```
🚚 Delivery Address:
Roxas Boulevard, Malate, Manila, Metro Manila, 1004, Philippines
```

### Buyer's Order History
```
🚚 Delivery to:
Roxas Boulevard, Malate, Manila, Metro Manila, 1004, Philippines
```

## Usage Guidelines

### For Development

1. **No Configuration Needed**: Works out of the box with existing setup
2. **SSR Handling**: Components use dynamic imports to prevent SSR issues
3. **Leaflet CSS**: Already imported in relevant pages

### For Users

1. **Location Permissions**: Browser may ask for location access (optional)
2. **Map Interaction**: 
   - Click to select location
   - Drag marker to adjust
   - Zoom/pan to explore area
3. **Address Verification**: Always review auto-filled address before submitting

## Best Practices

### For Accurate Delivery

1. **Zoom In**: Zoom into the map for precise location selection
2. **Verify Address**: Check that auto-filled address matches intended location
3. **Add Details**: Include unit number, building name in address field
4. **Landmarks**: Mention nearby landmarks in address for easier finding

### For Farmers

1. **Contact Buyer**: Call buyer if address is unclear
2. **Use Coordinates**: Copy coordinates to Google Maps/Waze for navigation
3. **Update Status**: Mark as "out-for-delivery" when departing
4. **Confirm Delivery**: Mark "completed" upon successful delivery

## Privacy & Security

- Location data is only stored for order fulfillment
- Only buyer and assigned farmer can see delivery address
- Coordinates help ensure accurate delivery
- Users can manually enter address if they prefer not to use location services

## Future Enhancements

Potential improvements:
- [ ] Route optimization for multiple deliveries
- [ ] Real-time delivery tracking
- [ ] Delivery radius calculation
- [ ] Delivery fee based on distance
- [ ] Save favorite delivery addresses
- [ ] Integration with Google Maps/Waze for navigation
