# 🔧 URGENT: Google Maps API Key Configuration

## ⚠️ Action Required

Your map is currently showing an **Invalid API Key** error. Follow these steps to fix it:

---

## Option 1: Using Environment Variables (RECOMMENDED)

1. **Create `.env.local` file** in the root directory (if it doesn't exist):
```bash
# Windows PowerShell
New-Item -Path ".env.local" -ItemType File -Force
```

2. **Add your Google Maps API key** to `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_YOUR_ACTUAL_API_KEY_HERE
```

3. **Restart your development server**:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

4. **Make sure `.env.local` is in `.gitignore`** (already done):
```gitignore
.env.local
.env*.local
```

---

## Option 2: Quick Test (Temporary)

For quick testing, you can temporarily hardcode the API key:

1. Open `app/dashboard/map/MapComponent.tsx`
2. Find line ~52 (in the script.src line)
3. Replace:
```typescript
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";
```

With:
```typescript
const apiKey = "AIzaSyD_YOUR_ACTUAL_API_KEY_HERE";
```

⚠️ **WARNING**: Don't commit this to Git! Use Option 1 for production.

---

## How to Get a Google Maps API Key

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Create/Select Project
1. Click the project dropdown at the top
2. Click "New Project" (or select existing one)
3. Name it (e.g., "HarvestHub")
4. Click "Create"

### Step 3: Enable Maps JavaScript API
1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Maps JavaScript API"**
3. Click on it
4. Click **"Enable"**

### Step 4: Create API Key
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. **Copy the API key** (it will look like: `AIzaSyD...`)

### Step 5: Restrict the API Key (Important for Security!)
1. Click on the newly created API key to edit it
2. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Click **"Add an item"**
   - Add: `localhost:3000/*`
   - Add: `127.0.0.1:3000/*`
   - (Later add your production domain: `yourdomain.com/*`)
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check **"Maps JavaScript API"**
4. Click **"Save"**

### Step 6: Enable Billing
Google Maps requires billing to be enabled (but gives you $200 free credits per month):

1. Go to **"Billing"** in the left menu
2. Click **"Link a billing account"**
3. Follow the steps to add a credit card
4. Don't worry - you get **$200 free** every month, which covers ~28,500 map loads

---

## Testing the Fix

After adding your API key:

1. **Clear browser cache** (or open in incognito/private mode)
2. **Navigate to**: http://localhost:3000/dashboard/map
3. **Allow location permissions** when prompted
4. You should see:
   - ✅ Google Maps loaded without errors
   - ✅ Blue marker for your location
   - ✅ Green markers for farmers (if any have locations)

---

## Adding Test Farmer Locations

To see farmers on the map, add locations to farmer accounts:

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Navigate to**: Firestore Database → `users` collection
3. **Find a farmer user** (role: "farmer")
4. **Click on the document**
5. **Add a field**:
   - **Field name**: `location`
   - **Type**: `map`
   - **Add subfields**:
     - `lat` (number): `14.5995`
     - `lng` (number): `120.9842`
     - `address` (string): `"Quezon City, Metro Manila"` (optional)
6. **Click Update**

### Sample Test Locations (Metro Manila):
```javascript
// Quezon City
{ lat: 14.5995, lng: 120.9842 }

// Mandaluyong
{ lat: 14.5547, lng: 121.0244 }

// Marikina
{ lat: 14.6760, lng: 121.0437 }

// Pasig
{ lat: 14.5243, lng: 121.0792 }

// Makati
{ lat: 14.5547, lng: 121.0244 }
```

---

## Common Errors Fixed

### ✅ "You have included the Google Maps JavaScript API multiple times"
**Fixed**: Added check to prevent loading script multiple times

### ✅ "InvalidValueError: setPosition: not a LatLng or LatLngLiteral"
**Fixed**: Ensured all positions use proper `{ lat: number, lng: number }` format

### ✅ "InvalidKeyMapError"
**Action Required**: Add your API key using Option 1 or 2 above

---

## File Structure Check

Your project should have:
```
harvest-hub/
├── .env.local                          # ← API key here (create this)
├── .gitignore                          # ← .env.local should be listed here
├── app/
│   └── dashboard/
│       └── map/
│           ├── page.tsx                # ← Main map page
│           └── MapComponent.tsx        # ← Google Maps component (fixed)
```

---

## Verification Checklist

Before considering this complete:

- [ ] Got Google Maps API key from Google Cloud Console
- [ ] Enabled "Maps JavaScript API"
- [ ] Enabled billing (for free credits)
- [ ] Added API key to `.env.local` file
- [ ] Restarted development server (`npm run dev`)
- [ ] Cleared browser cache or used incognito mode
- [ ] No console errors about API key
- [ ] Map loads successfully
- [ ] Can see location markers

---

## Cost Information

**Google Maps Pricing** (with free tier):
- **Free credits**: $200/month
- **Maps JavaScript API**: $7 per 1,000 loads
- **Free monthly loads**: ~28,500 (enough for most applications!)

**Monthly cost estimate** for typical usage:
- Small app (< 1,000 users): **$0** (within free tier)
- Medium app (1,000-5,000 users): **$0-50**
- Large app (5,000+ users): Monitor and set quotas

---

## Need Help?

1. **Check the console** for specific error messages
2. **Verify API key** is correct (copy-paste carefully)
3. **Check billing** is enabled on Google Cloud
4. **Ensure Maps JavaScript API** is enabled
5. **Try incognito mode** to rule out caching issues

---

## Quick Test Command

After setup, test with:
```bash
# Check if env variable is loaded
# (Windows PowerShell)
Get-Content .env.local

# Restart server
npm run dev
```

---

**Status**: 🔴 API Key Required  
**Priority**: High  
**Estimated Time**: 5-10 minutes  
**Cost**: Free (with Google Cloud free tier)

---

For more details, see `GOOGLE_MAPS_QUICK_START.md` and `GEO_MAPPING_DOCUMENTATION.md`.
