# 🗺️ Quick Start - Google Maps Setup

## Important: API Key Required

The Geo-Mapping feature requires a Google Maps API key to function. Follow these simple steps:

---

## Step 1: Get Your Google Maps API Key

1. Go to **Google Cloud Console**: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click "Select a project" at the top
   - Click "New Project"
   - Name it (e.g., "HarvestHub Maps")
   - Click "Create"

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search for "Maps JavaScript API"
   - Click on it and press "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Your API key will be displayed - **COPY IT**

5. **Secure Your API Key** (Important!)
   - Click "Restrict Key" or edit the newly created key
   - Under "Application restrictions":
     - Select "HTTP referrers (web sites)"
     - Add: `localhost:3000/*` (for development)
     - Add: `yourdomain.com/*` (for production)
   - Under "API restrictions":
     - Select "Restrict key"
     - Check only "Maps JavaScript API"
   - Click "Save"

6. **Enable Billing** (Required for Google Maps)
   - Go to "Billing" in the menu
   - Add a billing account
   - Google provides $200 free credits per month
   - This is sufficient for most small to medium applications

---

## Step 2: Add API Key to Your Project

### Method 1: Environment Variable (Recommended)

1. Create a file named `.env.local` in the root directory:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...your_actual_key_here
```

2. Open `app/dashboard/map/MapComponent.tsx`

3. Find line ~48 and update it to:
```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
```

### Method 2: Direct Key (Quick test only)

Open `app/dashboard/map/MapComponent.tsx` and find this line (~48):
```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
```

Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key:
```typescript
script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD...your_key&libraries=places`;
```

⚠️ **Warning**: Method 2 exposes your key in code. Use Method 1 for production!

---

## Step 3: Add Farmer Locations

Farmers need locations to appear on the map.

### Option A: Via Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database
4. Find a farmer user in the `users` collection
5. Click on the document
6. Add a new field:
   - Field: `location`
   - Type: Map
   - Add these subfields:
     - `lat` (number): 14.5995
     - `lng` (number): 120.9842
     - `address` (string): "Quezon City, Metro Manila"

### Option B: Get Current Location (Browser)

When you visit `/dashboard/map` as any user:
1. Browser will ask for location permission
2. Click "Allow"
3. Your location will be saved automatically

For farmers, you can create a location update feature (see `GEO_MAPPING_DOCUMENTATION.md`).

---

## Step 4: Test the Map

1. Start your development server:
```bash
npm run dev
```

2. Login to HarvestHub

3. Navigate to "Farmer Map" from the dashboard

4. You should see:
   - ✅ Google Maps loaded
   - ✅ Your location (blue marker)
   - ✅ Farmer locations (green markers)
   - ✅ Distance lines
   - ✅ Distance calculations

---

## 🎯 Sample Farmer Locations for Testing

If you want to add multiple test farmers, use these Metro Manila coordinates:

```javascript
// Add these to different farmer accounts
Farmer 1 (Quezon City):    lat: 14.5995, lng: 120.9842
Farmer 2 (Mandaluyong):     lat: 14.5547, lng: 121.0244
Farmer 3 (Marikina):        lat: 14.6760, lng: 121.0437
Farmer 4 (Pasig):           lat: 14.5243, lng: 121.0792
Farmer 5 (Makati):          lat: 14.5547, lng: 121.0244
```

---

## 🐛 Troubleshooting

### Map shows "Loading Google Maps..." forever
**Fix:** Check your API key is correct and Maps JavaScript API is enabled

### Map shows error "RefererNotAllowedMapError"
**Fix:** Add your domain to API key restrictions (localhost:3000)

### Map appears gray with no tiles
**Fix:** Enable billing on Google Cloud Console

### Location permission denied
**Fix:** 
- Use HTTPS or localhost
- Check browser location settings
- Try different browser

### Farmers don't appear on map
**Fix:** 
- Verify farmers have `location` field in Firestore
- Check location has valid `lat` and `lng` numbers
- Ensure you're within search radius

---

## 💡 Important Notes

1. **HTTPS Required for Production**
   - Geolocation only works on HTTPS or localhost
   - Deploy to Vercel/Netlify for automatic HTTPS

2. **Billing Required**
   - Google Maps requires billing enabled
   - You get $200 free credits/month
   - Track usage at: https://console.cloud.google.com

3. **API Key Security**
   - Never commit API keys to Git
   - Add `.env.local` to `.gitignore`
   - Use environment variables
   - Restrict API key properly

4. **Rate Limits**
   - Free tier: 28,500 map loads per month
   - After free credits: $7 per 1,000 loads
   - Set daily quotas to control costs

---

## 📊 Google Maps Pricing

| Service | Free Tier | After Free Credits |
|---------|-----------|-------------------|
| Maps JavaScript API | 28,500 loads/month | $7 per 1,000 loads |
| Geocoding API | 40,000 requests/month | $5 per 1,000 requests |
| Places API | 50,000 requests/month | Varies by request type |

**Your $200 free credit = ~28,500 map loads per month = FREE for most applications!**

---

## ✅ Success Checklist

- [ ] Got Google Maps API key
- [ ] Enabled Maps JavaScript API
- [ ] Restricted API key properly
- [ ] Enabled billing (for free credits)
- [ ] Added API key to project (Method 1 or 2)
- [ ] Added location to at least one farmer
- [ ] Tested map at `/dashboard/map`
- [ ] See markers and distance calculations working

---

## 🚀 You're Done!

Once the map loads successfully with markers, you're all set! 

For more advanced features (route optimization, delivery zones, etc.), see `GEO_MAPPING_DOCUMENTATION.md`.

**Need help?** Check the troubleshooting section above or refer to:
- Complete guide: `GEO_MAPPING_DOCUMENTATION.md`
- Full feature docs: `COMPLETE_FEATURES_DOCUMENTATION.md`
- Setup checklist: `SETUP_CHECKLIST.md`

---

**Last Updated**: January 2024  
**Difficulty**: Easy (5-10 minutes)  
**Cost**: Free (with $200/month credits)
