# Google Maps API Setup for HarvestHub

This guide explains how to set up Google Maps for the delivery location picker feature.

## Steps to Enable Google Maps

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API (optional, for address autocomplete)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### 2. Restrict Your API Key (Recommended)

1. Click on your API key in the Credentials page
2. Under **Application restrictions**, select "HTTP referrers (web sites)"
3. Add your domain(s):
   ```
   localhost:3000
   yourdomain.com
   *.yourdomain.com
   ```
4. Under **API restrictions**, select "Restrict key"
5. Select the APIs you enabled above

### 3. Add API Key to Your Project

1. Create a `.env.local` file in the root of your project (copy from `.env.local.example`):
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your Google Maps API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Features

The delivery location picker provides:

- 📍 **Interactive Map**: Click anywhere to set delivery location
- 🎯 **Draggable Marker**: Drag the pin to adjust the exact location
- 🌍 **Current Location**: Automatically detects and centers on user's location (with permission)
- 📝 **Reverse Geocoding**: Automatically fills the address field with the selected location
- 📊 **Coordinates Storage**: Stores latitude and longitude for precise delivery tracking

## Usage

When placing an order with delivery:

1. Enter your delivery address manually, OR
2. Click "Pin Location on Map"
3. Allow location access (optional) to auto-center on your current location
4. Click on the map or drag the marker to your exact delivery location
5. The address field will auto-fill with the selected location
6. Complete your order

The delivery location (coordinates + address) will be saved with the order for the farmer to see.

## Pricing

Google Maps offers a generous free tier:
- **$200 monthly credit** (free)
- Maps JavaScript API: $7 per 1,000 loads (after free tier)
- Geocoding API: $5 per 1,000 requests (after free tier)

For a small to medium marketplace, you'll likely stay within the free tier.

## Troubleshooting

### Map not loading?
- Check that your API key is correct in `.env.local`
- Verify the APIs are enabled in Google Cloud Console
- Check browser console for error messages
- Ensure you've restarted the development server

### "This page can't load Google Maps correctly"
- Your API key may be restricted to specific domains
- Add `localhost:3000` to your API key restrictions in Google Cloud Console

### Location detection not working?
- User must grant location permissions in the browser
- HTTPS is required for geolocation (not needed on localhost)
- Some browsers block location access in certain contexts
