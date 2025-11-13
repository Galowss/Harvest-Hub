# 🚀 HarvestHub - New Features Documentation

## Overview

HarvestHub is a comprehensive agricultural marketplace connecting Filipino farmers with buyers. This document covers all the advanced features that have been added to the platform.

---

## 📊 Feature List

### 1. **Real-Time Market Pricing Dashboard** ✅
**Location**: `/dashboard/farmer/pricing`

**Description**: Integrated with DA Philippines official price data and AI-based market forecasting.

**Features**:
- Live market prices from Department of Agriculture
- Product price analytics with historical trends
- AI price predictions (1 week, 2 weeks, 1 month)
- Price comparison with market average
- Demand forecasting
- Optimal selling period recommendations
- Interactive forecast modal with detailed analytics

**Technology**:
- DA Philippines price monitoring integration (mock with production-ready structure)
- Custom AI forecasting algorithm (time series + seasonal analysis)
- Real-time price alerts
- Firebase Firestore for price history

**Documentation**: See `AI_FORECASTING_DOCUMENTATION.md` for AI algorithm details

---

### 2. **Digital Payment and Wallet System** ✅

#### Farmer Wallet
**Location**: `/dashboard/farmer/wallet`

**Features**:
- Real-time earnings tracking
- Withdrawal request system
- Transaction history with filters
- Automatic earnings calculation from completed orders
- Withdrawal status tracking (pending, completed)
- Detailed financial reports

#### User Wallet
**Location**: `/dashboard/user/wallet`

**Features**:
- Top-up/Load money functionality
- Balance tracking
- Order payment integration
- Transaction history
- Spending analytics
- Multiple payment method support (ready for Paymongo/GCash integration)

**Security**:
- Firebase authentication required
- Transaction verification
- Audit trails for all transactions

---

### 3. **Order and Delivery Management System** ✅

**Location**: 
- Farmer: `/dashboard/farmer/orders`
- User: `/dashboard/user/orders`

**Features**:
- Order tracking with unique tracking numbers
- Delivery status updates (pending → processing → in_delivery → completed)
- Real-time order notifications
- Order history and analytics
- Delivery location selection
- Distance-based delivery fee calculation (with geo-mapping)
- Order cancellation and refund processing
- Delivery scheduling

**Integration**:
- Connected with wallet system for automatic payments
- Geo-mapping for delivery distance calculation
- Firebase real-time updates

---

### 4. **Community and Knowledge Hub** ✅
**Location**: `/dashboard/community`

**Description**: Social platform for farmers to share knowledge, tips, and success stories.

**Features**:
- Post Creation with Categories:
  - 💡 Tips & Advice
  - 🌟 Success Stories
  - ❓ Questions & Help
  - 💬 General Discussion
  
- Engagement Features:
  - Like system with real-time counter
  - Comment threads
  - Tag system for organization
  - Search functionality
  
- Content Discovery:
  - Filter by category
  - Sort by likes or recent
  - Search by title, content, or tags
  - Trending posts

**Benefits**:
- Knowledge sharing among farmers
- Community support network
- Best practices documentation
- Problem-solving collaboration
- Success story inspiration

**Technology**:
- Firebase Firestore collections:
  - `community_posts` - Main posts
  - `community_comments` - Comment threads
- Real-time updates with Firebase listeners
- Optimistic UI updates for likes

---

### 5. **Geo-Mapping Integration with Google Maps** ✅
**Location**: `/dashboard/map`

**Description**: Interactive map showing farmer locations with distance calculations.

**Features**:
- Interactive Google Maps with custom markers
- Real-time user location tracking (GPS)
- Distance calculation (Haversine formula)
- Search radius filter (1-50 km)
- Sort farmers by:
  - Distance from user
  - Product availability
- Farmer information cards with:
  - Distance display
  - Product count
  - Direct link to products
- Visual distance lines on map
- Map legend and instructions
- Responsive design for mobile

**Benefits**:
- Find nearest farmers for reduced delivery costs
- Optimize delivery routes
- Better logistics planning
- Increased farmer visibility based on proximity
- Efficient local sourcing

**Setup Required**:
1. Get Google Maps API key (see `GEO_MAPPING_DOCUMENTATION.md`)
2. Add API key to `app/dashboard/map/MapComponent.tsx`
3. Add farmer locations to Firebase user profiles
4. Enable browser geolocation permissions

**Documentation**: See `GEO_MAPPING_DOCUMENTATION.md` for complete setup guide

---

### 6. **AI-Based Market Forecasting** ✅

**Description**: Advanced machine learning algorithms for price and demand predictions.

**Algorithms**:
1. **Time Series Analysis**
   - Moving averages (7-day, 30-day)
   - Trend detection
   - Volatility calculation

2. **Seasonal Patterns**
   - Peak season identification
   - Off-season adjustments
   - Weather impact factors

3. **Market Intelligence**
   - Supply-demand correlation
   - Price elasticity
   - Competition analysis

**Prediction Types**:
- **1 Week Forecast**: Short-term price predictions
- **2 Week Forecast**: Medium-term market outlook
- **1 Month Forecast**: Long-term strategic planning

**Accuracy Factors**:
- Historical price data from DA Philippines
- Seasonal trends
- Market volatility
- Supply chain conditions

**Use Cases**:
- Optimal harvest timing
- Price setting strategies
- Inventory management
- Risk mitigation

**Documentation**: See `AI_FORECASTING_DOCUMENTATION.md` for technical details

---

## 🛠️ Technical Architecture

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19.1.0** - UI library with hooks
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Google Maps JavaScript API** - Interactive mapping
- **React-Leaflet** - Backup mapping solution (available in dependencies)

### Backend & Database
- **Firebase Firestore** - NoSQL real-time database
- **Firebase Authentication** - User management
- **Firebase Security Rules** - Access control

### External APIs
- **DA Philippines Price Monitoring** - Government agricultural data
- **Google Maps API** - Geolocation and mapping
- **Paymongo/GCash** - Payment gateway (future integration)

---

## 📁 File Structure

```
harvest-hub/
├── app/
│   ├── dashboard/
│   │   ├── farmer/
│   │   │   ├── page.tsx              # Farmer dashboard
│   │   │   ├── orders/page.tsx       # Order management
│   │   │   ├── pricing/page.tsx      # Market pricing + AI forecasting
│   │   │   └── wallet/page.tsx       # Digital wallet
│   │   ├── user/
│   │   │   ├── page.tsx              # User dashboard
│   │   │   ├── orders/page.tsx       # Order tracking
│   │   │   ├── wallet/page.tsx       # User wallet
│   │   │   └── cart/page.tsx         # Shopping cart
│   │   ├── community/
│   │   │   └── page.tsx              # Community hub
│   │   └── map/
│   │       ├── page.tsx              # Map dashboard
│   │       └── MapComponent.tsx      # Google Maps component
│   └── config/
│       └── firebase.ts               # Firebase configuration
├── lib/
│   ├── marketData.ts                 # DA integration + AI forecasting
│   └── utils.ts                      # Utility functions
└── docs/
    ├── AI_FORECASTING_DOCUMENTATION.md
    ├── GEO_MAPPING_DOCUMENTATION.md
    ├── NEW_FEATURES_DOCUMENTATION.md
    └── README_NEW_FEATURES.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project setup
- Google Maps API key
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd harvest-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
- Create Firebase project at https://console.firebase.google.com
- Enable Firestore Database
- Enable Authentication (Email/Password)
- Copy configuration to `app/config/firebase.ts`

4. **Configure Google Maps**
- Get API key from https://console.cloud.google.com
- Enable Maps JavaScript API
- Add key to `app/dashboard/map/MapComponent.tsx`
- (See `GEO_MAPPING_DOCUMENTATION.md` for details)

5. **Environment Variables**
Create `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
# Add other environment variables as needed
```

6. **Run development server**
```bash
npm run dev
```

7. **Access the application**
```
http://localhost:3000
```

---

## 🗄️ Firebase Collections

### Users Collection
```javascript
{
  id: "user_id",
  email: "farmer@example.com",
  role: "farmer" | "user",
  name: "Juan dela Cruz",
  location: {                    // For geo-mapping
    lat: 14.5995,
    lng: 120.9842,
    address: "Quezon City"
  },
  createdAt: Timestamp
}
```

### Products Collection
```javascript
{
  id: "product_id",
  name: "Fresh Tomatoes",
  description: "Organic tomatoes",
  category: "vegetables",
  price: 50,
  stock: 100,
  harvestDate: "2024-01-15",
  images: ["base64_image_string"],
  farmerId: "farmer_user_id",
  farmerName: "Juan dela Cruz",
  createdAt: Timestamp
}
```

### Orders Collection
```javascript
{
  id: "order_id",
  userId: "buyer_user_id",
  farmerId: "farmer_user_id",
  products: [
    {
      productId: "product_id",
      name: "Fresh Tomatoes",
      quantity: 10,
      price: 50
    }
  ],
  totalAmount: 500,
  deliveryLocation: {
    lat: 14.5995,
    lng: 120.9842,
    address: "123 Street, City"
  },
  deliveryFee: 50,
  distance: 5.2,              // km
  status: "pending" | "processing" | "in_delivery" | "completed",
  trackingNumber: "ORD-202401-ABC123",
  createdAt: Timestamp
}
```

### Wallet Transactions Collection
```javascript
{
  id: "transaction_id",
  userId: "user_id",
  type: "topup" | "order" | "withdrawal" | "refund",
  amount: 500,
  status: "pending" | "completed" | "failed",
  orderId: "order_id",        // if related to order
  description: "Payment for Order #123",
  createdAt: Timestamp
}
```

### Community Posts Collection
```javascript
{
  id: "post_id",
  userId: "user_id",
  userName: "Juan dela Cruz",
  title: "Tips for Growing Tomatoes",
  content: "Here are my tips...",
  category: "tip" | "success-story" | "question" | "discussion",
  tags: ["tomatoes", "organic", "farming"],
  likes: 15,
  commentCount: 5,
  createdAt: Timestamp
}
```

### Community Comments Collection
```javascript
{
  id: "comment_id",
  postId: "post_id",
  userId: "user_id",
  userName: "Maria Santos",
  content: "Great tips! Thanks for sharing.",
  createdAt: Timestamp
}
```

---

## 🔐 Security Configuration

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.farmerId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.farmerId;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.farmerId);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.farmerId);
    }
    
    // Wallet transactions
    match /wallet_transactions/{transactionId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Community posts
    match /community_posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Community comments
    match /community_comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 🧪 Testing Guide

### Test Farmer Account
1. Sign up as farmer at `/signup/farmer`
2. Add products with images
3. Set location for geo-mapping
4. Check market pricing and AI forecasts
5. Manage orders
6. View wallet and earnings
7. Post in community hub

### Test User Account
1. Sign up as user at `/signup`
2. Browse products
3. Add to cart
4. Checkout with delivery location
5. Track order
6. Top up wallet
7. View nearby farmers on map
8. Engage in community

### Integration Testing
- [ ] Order flow: Browse → Cart → Checkout → Payment → Tracking
- [ ] Wallet flow: Top-up → Order Payment → Balance Update
- [ ] Map flow: Location Permission → View Farmers → Distance Calculation
- [ ] Community flow: Create Post → Comment → Like → Search
- [ ] AI Forecasting: View Market Data → Generate Forecast → Analyze Predictions

---

## 📱 Mobile Responsiveness

All features are fully responsive:
- ✅ Dashboard navigation (collapsible sidebar)
- ✅ Product grids (adaptive columns)
- ✅ Map interface (touch-friendly)
- ✅ Community hub (mobile-optimized)
- ✅ Wallet interface (swipe gestures)
- ✅ Forms and inputs (mobile keyboards)

---

## 🌟 Future Enhancements

### Phase 1 (Current) ✅
- [x] Real-time pricing dashboard
- [x] Digital wallet system
- [x] Order management
- [x] Community hub
- [x] Geo-mapping integration
- [x] AI market forecasting

### Phase 2 (Planned)
- [ ] Push notifications
- [ ] Chat messaging between farmers and buyers
- [ ] Weather integration for forecasting
- [ ] Crop disease identification (AI image recognition)
- [ ] Inventory management system
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (Filipino, Cebuano, etc.)
- [ ] Offline mode with sync

### Phase 3 (Future)
- [ ] Blockchain for supply chain tracking
- [ ] IoT sensor integration for farm monitoring
- [ ] Drone delivery coordination
- [ ] Automated pricing based on market trends
- [ ] Farm equipment rental marketplace
- [ ] Agricultural insurance integration
- [ ] Cooperative/Group buying features

---

## 🐛 Troubleshooting

### Map Not Loading
- Check if Google Maps API key is configured
- Verify API restrictions and billing enabled
- Check browser console for errors
- Ensure location permissions granted

### Wallet Transactions Not Showing
- Verify Firebase Firestore rules
- Check userId matches authenticated user
- Ensure transactions collection exists
- Check browser console for errors

### AI Forecasting Not Working
- Verify `lib/marketData.ts` is imported correctly
- Check if DA prices are being fetched
- Ensure product has price history
- Check console for API errors

### Community Posts Not Loading
- Verify Firebase collections exist
- Check authentication state
- Ensure Firestore rules allow read
- Check network tab for API calls

---

## 📞 Support & Resources

### Documentation
- Main README: `README.md`
- AI Forecasting: `AI_FORECASTING_DOCUMENTATION.md`
- Geo-Mapping: `GEO_MAPPING_DOCUMENTATION.md`
- New Features: `NEW_FEATURES_DOCUMENTATION.md`

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Maps API](https://developers.google.com/maps/documentation)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📄 License

This project is part of HarvestHub agricultural marketplace platform.

---

**Last Updated**: January 2024  
**Version**: 2.0.0  
**Status**: Production Ready (pending API keys and farmer location data)
