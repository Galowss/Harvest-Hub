# ✅ HarvestHub Setup Checklist

Use this checklist to ensure all features are properly configured and working.

---

## 🔧 Initial Setup

### 1. Project Installation
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Verify all dependencies installed (check `package.json`)

### 2. Firebase Configuration
- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Firestore Database
- [ ] Enable Authentication (Email/Password provider)
- [ ] Copy Firebase config to `app/config/firebase.ts`
- [ ] Deploy Firestore security rules (see `COMPLETE_FEATURES_DOCUMENTATION.md`)
- [ ] Create initial collections:
  - [ ] `users`
  - [ ] `products`
  - [ ] `orders`
  - [ ] `wallet_transactions`
  - [ ] `community_posts`
  - [ ] `community_comments`

### 3. Environment Variables
- [ ] Create `.env.local` file in root directory
- [ ] Add Google Maps API key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key`
- [ ] Add to `.gitignore`: `.env.local`

### 4. Google Maps API Setup
- [ ] Go to Google Cloud Console: https://console.cloud.google.com
- [ ] Create new project or select existing
- [ ] Enable APIs:
  - [ ] Maps JavaScript API
  - [ ] Places API (optional)
  - [ ] Geocoding API (optional)
- [ ] Create API key (Credentials → Create Credentials → API Key)
- [ ] Restrict API key:
  - [ ] Set HTTP referrer restrictions (localhost:3000, your domain)
  - [ ] Restrict to Maps JavaScript API
- [ ] Enable billing (required for Google Maps)
- [ ] Add API key to `app/dashboard/map/MapComponent.tsx` or `.env.local`

---

## 🧪 Feature Testing

### ✅ User Authentication
- [ ] Sign up as new user
- [ ] Sign up as farmer
- [ ] Login with existing credentials
- [ ] Logout functionality
- [ ] Role-based access (farmer vs user dashboards)

### ✅ Product Management (Farmer)
- [ ] Add new product with images
- [ ] Edit existing product
- [ ] Delete product
- [ ] View product list
- [ ] Image upload and compression working
- [ ] Categories properly assigned

### ✅ Market Pricing Dashboard (Farmer)
- [ ] Access `/dashboard/farmer/pricing`
- [ ] View product price analytics
- [ ] See DA Philippines reference prices
- [ ] Click "🤖 AI Forecast" button
- [ ] View 1 week, 2 weeks, 1 month predictions
- [ ] Check demand forecasting
- [ ] Review optimal sale periods

### ✅ Digital Wallet (Farmer)
- [ ] Access `/dashboard/farmer/wallet`
- [ ] View current balance
- [ ] See earnings from completed orders
- [ ] Request withdrawal
- [ ] View transaction history
- [ ] Filter transactions by type

### ✅ Digital Wallet (User)
- [ ] Access `/dashboard/user/wallet`
- [ ] Top up balance
- [ ] View current balance
- [ ] Make order payment
- [ ] View transaction history
- [ ] Check spending analytics

### ✅ Order Management
**Farmer Side:**
- [ ] View incoming orders at `/dashboard/farmer/orders`
- [ ] Update order status (pending → processing → in_delivery → completed)
- [ ] View order details (products, customer, delivery location)
- [ ] Track order history

**User Side:**
- [ ] Browse products at `/dashboard/user`
- [ ] Add products to cart
- [ ] Select delivery location
- [ ] Complete checkout
- [ ] Track order at `/dashboard/user/orders`
- [ ] View tracking number
- [ ] See delivery status updates

### ✅ Geo-Mapping Integration
- [ ] Access `/dashboard/map`
- [ ] Allow browser location permissions
- [ ] See your location marker (blue circle)
- [ ] View farmer markers (green pins)
- [ ] Click farmer markers for info
- [ ] See distance calculations
- [ ] Adjust search radius slider
- [ ] Sort by distance
- [ ] Sort by product count
- [ ] Click "View Products" links
- [ ] Test on mobile (responsive)

### ✅ Community Hub
- [ ] Access `/dashboard/community`
- [ ] Create new post (all categories):
  - [ ] Tip & Advice
  - [ ] Success Story
  - [ ] Question
  - [ ] Discussion
- [ ] Add tags to posts
- [ ] Like posts
- [ ] Comment on posts
- [ ] Search posts by keyword
- [ ] Filter by category
- [ ] View post details in modal
- [ ] Delete own posts
- [ ] Delete own comments

### ✅ AI Market Forecasting
- [ ] Access pricing dashboard
- [ ] Click AI Forecast button
- [ ] See price predictions for different timeframes
- [ ] View confidence levels
- [ ] Check demand forecasting
- [ ] Review optimal sale periods
- [ ] See price trend indicators

---

## 📊 Data Setup

### Add Sample Farmer with Location
1. Sign up as farmer
2. Go to Firebase Console → Firestore
3. Find your user document in `users` collection
4. Add `location` field:
```json
{
  "location": {
    "lat": 14.5995,
    "lng": 120.9842,
    "address": "Quezon City, Metro Manila"
  }
}
```

### Add Multiple Test Farmers (for mapping)
Create multiple farmer accounts with different locations:
```javascript
// Metro Manila locations
Farmer 1: { lat: 14.5995, lng: 120.9842 } // Quezon City
Farmer 2: { lat: 14.5547, lng: 121.0244 } // Mandaluyong
Farmer 3: { lat: 14.6760, lng: 121.0437 } // Marikina
Farmer 4: { lat: 14.5243, lng: 121.0792 } // Pasig
Farmer 5: { lat: 14.6507, lng: 121.0494 } // San Juan
```

### Add Sample Products
Each farmer should add at least 3-5 products with:
- Product name
- Description
- Category
- Price
- Stock
- Images
- Harvest date

### Create Sample Orders
1. Login as user
2. Add products to cart
3. Select delivery location
4. Complete order
5. Farmer updates order status

### Add Community Content
1. Create 5-10 posts in different categories
2. Add comments to posts
3. Like various posts
4. Tag posts appropriately

---

## 🔍 Performance Checks

### Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Products load in < 3 seconds
- [ ] Map loads in < 5 seconds
- [ ] Community posts load in < 2 seconds

### Image Optimization
- [ ] Images compressed properly (< 500KB each)
- [ ] Base64 images display correctly
- [ ] Multiple images per product work
- [ ] Image upload doesn't hang

### Map Performance
- [ ] Map renders smoothly
- [ ] Markers load without lag
- [ ] Distance lines display correctly
- [ ] No console errors with map

### Mobile Experience
- [ ] All pages responsive
- [ ] Touch interactions work
- [ ] Navigation accessible
- [ ] Forms usable on mobile
- [ ] Map touch-friendly

---

## 🐛 Common Issues & Solutions

### Issue: Map not loading
**Solutions:**
- Check API key is correct in `MapComponent.tsx` or `.env.local`
- Verify Google Maps JavaScript API is enabled
- Check billing is enabled on Google Cloud
- Look for console errors
- Test on HTTPS or localhost

### Issue: Wallet transactions not showing
**Solutions:**
- Check Firestore security rules allow read
- Verify userId matches authenticated user
- Ensure `wallet_transactions` collection exists
- Check browser console for errors

### Issue: AI forecast not generating
**Solutions:**
- Verify `lib/marketData.ts` exists and is correct
- Check product has price data
- Ensure DA prices are being fetched (mock data should work)
- Look for JavaScript errors in console

### Issue: Images not uploading
**Solutions:**
- Check file size (should be < 50MB)
- Verify compression is working
- Test with smaller images
- Check Firebase storage quota (if using Firebase Storage)
- Try "Skip compression" option

### Issue: Community posts not loading
**Solutions:**
- Check Firebase security rules
- Verify user is authenticated
- Ensure `community_posts` collection exists
- Check browser network tab

---

## 📈 Monitoring & Maintenance

### Daily Checks
- [ ] Check Firebase usage quotas
- [ ] Monitor Google Maps API usage
- [ ] Review error logs in browser console
- [ ] Check order processing time

### Weekly Checks
- [ ] Review wallet transactions for errors
- [ ] Check map functionality
- [ ] Test AI forecasting accuracy
- [ ] Review community posts for spam

### Monthly Checks
- [ ] Analyze user engagement metrics
- [ ] Review Firebase costs
- [ ] Update DA Philippines price data integration
- [ ] Optimize database queries
- [ ] Clean up old transactions/orders

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] Google Maps API key restricted properly
- [ ] Images optimized
- [ ] No console errors
- [ ] Mobile tested

### Deployment
- [ ] Deploy to production (Vercel, Firebase Hosting, etc.)
- [ ] Update Google Maps API key restrictions with production domain
- [ ] Update Firebase authorized domains
- [ ] Test all features on production
- [ ] Monitor for errors

### Post-Deployment
- [ ] Verify SSL certificate (HTTPS)
- [ ] Test map on production (requires HTTPS)
- [ ] Check all API keys working
- [ ] Monitor Firebase usage
- [ ] Test user sign-up flow
- [ ] Verify order processing

---

## 📚 Documentation Review

- [ ] Read `README.md` for project overview
- [ ] Review `AI_FORECASTING_DOCUMENTATION.md` for AI details
- [ ] Check `GEO_MAPPING_DOCUMENTATION.md` for map setup
- [ ] Read `COMPLETE_FEATURES_DOCUMENTATION.md` for all features
- [ ] Keep this checklist handy for reference

---

## ✨ Success Criteria

Your HarvestHub installation is complete when:
- ✅ Farmers can add products with images
- ✅ Users can browse and order products
- ✅ Digital wallet system processes transactions
- ✅ Map shows farmers with distance calculations
- ✅ AI forecasting provides price predictions
- ✅ Community hub allows posting and engagement
- ✅ All features work on mobile devices
- ✅ No console errors on any page
- ✅ Firebase security rules are properly configured
- ✅ Google Maps displays correctly

---

## 🎯 Next Steps After Setup

1. **Add Real Data**
   - Get actual DA Philippines API access (replace mock data)
   - Add real farmer locations
   - Populate with actual products

2. **Enhance Features**
   - Add payment gateway (Paymongo/GCash)
   - Implement push notifications
   - Add real-time chat
   - Integrate weather data

3. **Optimize Performance**
   - Add caching layer
   - Implement lazy loading
   - Optimize Firestore queries
   - Add CDN for images

4. **Marketing & Launch**
   - Create landing page
   - Prepare user documentation
   - Train farmers on platform usage
   - Launch beta program

---

**Need Help?** Refer to the comprehensive documentation files included in the project!

**Last Updated**: January 2024  
**Version**: 2.0.0
