# 🏗️ HarvestHub System Architecture

## Overview
HarvestHub is a full-stack agricultural marketplace platform built with Next.js 15, React 19, and Firebase, featuring AI-powered price forecasting, real-time geospatial mapping, and Cash on Delivery (COD) payment system.

---

## 🎯 Architecture Pattern
**Client-Server Architecture with Serverless Backend**
- **Frontend**: Next.js (React) with Server-Side Rendering (SSR)
- **Backend**: Firebase (BaaS - Backend as a Service)
- **Deployment**: Vercel (Frontend) + Firebase Hosting (Alternative)

---

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │   Mobile     │  │   Tablet     │          │
│  │  (Browser)   │  │   Browser    │  │   Browser    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js 15 Application                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │  Pages   │  │Components│  │  Hooks   │  │  Utils   │ │ │
│  │  │  Router  │  │    UI    │  │ Context  │  │ Helpers  │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              State Management                              │ │
│  │         React Hooks (useState, useEffect)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   AI Price   │  │   Market     │  │   Order      │          │
│  │  Forecasting │  │  Analytics   │  │ Management   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ COD Payment  │  │   Rating     │  │   Location   │          │
│  │  Processing  │  │   System     │  │   Services   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Firebase SDK Integration                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │   Auth   │  │Firestore │  │ Storage  │  │Functions │ │ │
│  │  │  Service │  │  Service │  │ Service  │  │  (Cloud) │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Firebase Services                        │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐│ │
│  │  │  Firebase Authentication (JWT)                       ││ │
│  │  │  - Email/Password Auth                               ││ │
│  │  │  - Role-Based Access Control (RBAC)                  ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐│ │
│  │  │  Cloud Firestore (NoSQL Database)                    ││ │
│  │  │  - Real-time synchronization                         ││ │
│  │  │  - Security rules enforcement                        ││ │
│  │  │  - Scalable document storage                         ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐│ │
│  │  │  Firebase Storage                                     ││ │
│  │  │  - Image uploads (products, profiles)                ││ │
│  │  │  - Base64 encoding alternative                       ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ OpenStreetMap│  │ DA Philippines│  │   Payment    │          │
│  │   (Leaflet)  │  │  Price Data  │  │   Gateway    │          │
│  │  Map Tiles   │  │    API       │  │ (GCash/PayPal)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Database Schema (Firestore)

### Collections Structure

```javascript
// Users Collection
users/{userId}
├── email: string
├── name: string
├── role: "farmer" | "user" | "admin"
├── contact: string
├── profilePhoto: string (base64 or URL)
├── location: {
│   ├── lat: number
│   ├── lng: number
│   └── address: string
│   }
├── createdAt: timestamp
└── updatedAt: timestamp

// Products Collection
products/{productId}
├── name: string
├── description: string
├── price: number
├── quantity: number
├── category: string
├── farmerId: string (ref to users)
├── images: array<string> (base64 or URLs)
├── harvestDate: timestamp
├── unit: string
├── createdAt: timestamp
└── updatedAt: timestamp

// Orders Collection
orders/{orderId}
├── buyerId: string (ref to users)
├── farmerId: string (ref to users)
├── productId: string (ref to products)
├── productName: string
├── quantity: number
├── price: number
├── totalAmount: number
├── status: "pending" | "out-for-delivery" | "completed" | "cancelled"
├── deliveryMethod: "pickup" | "delivery"
├── deliveryAddress: string
├── buyerEmail: string
├── productImage: string
├── reviewed: boolean
├── createdAt: timestamp
└── updatedAt: timestamp

// Ratings Collection
ratings/{ratingId}
├── farmerId: string (ref to users)
├── userId: string (ref to users)
├── rating: number (1-5)
├── comment: string
├── orderId: string
└── createdAt: timestamp

// Community Posts Collection
community_posts/{postId}
├── authorId: string (ref to users)
├── authorName: string
├── content: string
├── images: array<string>
├── likes: number
├── likedBy: array<string>
├── commentCount: number
└── createdAt: timestamp

// Community Comments Collection
community_comments/{commentId}
├── postId: string (ref to community_posts)
├── authorId: string (ref to users)
├── authorName: string
├── content: string
└── createdAt: timestamp
```

---

## 🔐 Security Architecture

### Authentication Flow
```
User Input (Email/Password)
    ↓
Firebase Authentication
    ↓
JWT Token Generation
    ↓
Token Storage (Client)
    ↓
Protected Route Access
    ↓
Token Verification on Each Request
```

### Security Rules (Firestore)
```javascript
// Role-Based Access Control (RBAC)
- Admin: Full access to all collections
- Farmer: CRUD on own products, orders (with COD payment)
- User: Read products, CRUD on own orders, cart
- Public: No access (authentication required)
```

### Data Security Measures
- ✅ Firebase Authentication (JWT)
- ✅ Firestore Security Rules
- ✅ HTTPS encryption (enforced)
- ✅ Input validation
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Rate limiting (Firebase built-in)

---

## 🎨 Frontend Architecture

### Component Hierarchy
```
App
├── Layout
│   ├── Navbar (with responsive dropdown)
│   └── Footer
│
├── Pages
│   ├── / (Landing)
│   ├── /login
│   ├── /signup
│   │   └── /signup/farmer
│   │
│   ├── /dashboard/farmer
│   │   ├── / (Dashboard)
│   │   ├── /profile
│   │   ├── /orders
│   │   ├── /pricing (AI Forecasting)
│   │   ├── /ratings
│   │   └── /location
│   │
│   ├── /dashboard/user
│   │   ├── / (Dashboard)
│   │   ├── /cart
│   │   ├── /orders
│   │   └── /profile
│   │
│   ├── /dashboard/admin
│   ├── /dashboard/community
│   ├── /dashboard/map
│   └── /products
│
└── Components
    ├── Navbar.tsx
    ├── OrderCard.tsx
    ├── ProductImage.tsx
    ├── ClientOnly.tsx
    └── ui/
        ├── button.tsx
        └── dialog.tsx
```

### State Management
- **Local State**: React `useState` hooks
- **Side Effects**: React `useEffect` hooks
- **Auth State**: Firebase `onAuthStateChanged`
- **Real-time Updates**: Firestore listeners (optional)

---

## 🤖 AI & Analytics Architecture

### Price Forecasting System
```
Historical Price Data (DA Philippines API)
    ↓
Time Series Analysis
    ↓
Trend Detection Algorithm
    ↓
Price Prediction (7-30 days)
    ↓
Confidence Score Calculation
    ↓
Display to Farmer Dashboard
```

### Forecasting Algorithm
```javascript
// Input: Historical prices, product category
// Process:
1. Fetch DA Philippines price data
2. Generate historical price trends (30 days)
3. Apply time-series forecasting
   - Moving averages
   - Seasonal patterns
   - Market volatility
4. Calculate confidence scores
5. Generate 7-30 day predictions
// Output: Price forecasts with confidence levels
```

---

## 🗺️ Geospatial Architecture

### Map System
```
User Location Request
    ↓
Browser Geolocation API
    ↓
Leaflet.js Map Rendering
    ↓
OpenStreetMap Tile Loading
    ↓
Firestore Query (nearby farmers)
    ↓
Marker Placement (lat/lng)
    ↓
Distance Calculation
    ↓
Farmer List Display
```

### Location Services
- **Map Library**: Leaflet.js (open-source)
- **Tile Provider**: OpenStreetMap
- **Geocoding**: Browser Geolocation API
- **Distance Calc**: Haversine formula

---

## 💵 Cash on Delivery (COD) Payment Architecture

### COD Payment Flow
```
Order Placement
    ↓
Delivery Details Confirmation
    ↓
COD Payment Method Selected
    ↓
Order Created (status: pending)
    ↓
Farmer Notified (with payment amount)
    ↓
Buyer Reminded to Prepare Cash
```

### Transaction Flow
```
Order Placement
    ↓
Stock Validation
    ↓
Order Created (paymentMethod: COD)
    ↓
Farmer Accepts & Prepares Order
    ↓
Status: Out for Delivery (with cash reminder)
    ↓
Order Completion + Cash Collection
    ↓
Farmer Keeps Cash Payment
    ↓
Order Status: Completed
```

---

## 🔄 Data Flow Architecture

### User Purchase Flow
```
1. User browses products
2. Adds to cart
3. Proceeds to checkout
4. Selects delivery/pickup
5. Confirms COD payment method
6. Order created (status: pending, paymentMethod: COD)
7. Farmer receives notification with payment amount
8. Farmer processes order
9. Status updates (out-for-delivery) with cash reminder
10. Order delivered & cash payment collected
11. Order marked completed
12. User can rate farmer
```

### Real-time Updates
```javascript
// Auto-refresh Market Pricing
setInterval(() => {
  fetchMarketData()
}, 5 * 60 * 1000) // Every 5 minutes

// Firestore Real-time Listeners (Optional)
onSnapshot(collection(db, "orders"), (snapshot) => {
  // Update orders in real-time
})
```

---

## 🚀 Deployment Architecture

### Hosting Options

**Option 1: Vercel (Recommended)**
```
GitHub Repository
    ↓
Vercel Auto-Deploy
    ↓
CDN Distribution
    ↓
HTTPS Enabled
    ↓
Production URL
```

**Option 2: Firebase Hosting**
```
npm run build
    ↓
firebase deploy
    ↓
Firebase CDN
    ↓
Custom Domain (optional)
```

### Environment Configuration
```bash
# Production
- Next.js Production Build
- Firebase Production Project
- Optimized Assets
- CDN Caching

# Development
- Next.js Dev Server (localhost:3000)
- Firebase Development Project
- Hot Module Replacement
```

---

## 📦 Technology Stack

### Frontend
- **Framework**: Next.js 15.5.4
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI
- **Icons**: Lucide React
- **Maps**: Leaflet.js 1.9.4

### Backend
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore (NoSQL)
- **Storage**: Firebase Storage (optional)
- **Hosting**: Vercel / Firebase Hosting

### Development
- **Language**: TypeScript 5
- **Package Manager**: npm
- **Version Control**: Git + GitHub
- **IDE**: VS Code

---

## 🔧 System Configuration

### Firebase Configuration
```typescript
// app/config/firebase.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}
```

### Security Rules
- **Firestore Rules**: `firestore.rules`
- **Storage Rules**: `storage.rules`
- **Hosting Config**: `firebase.json`

---

## 📈 Scalability Considerations

### Performance Optimization
- ✅ Server-Side Rendering (SSR)
- ✅ Code Splitting
- ✅ Image Optimization (Next.js)
- ✅ Lazy Loading
- ✅ CDN Distribution
- ✅ Firestore Indexing

### Database Optimization
- ✅ Composite indexes for complex queries
- ✅ Pagination for large datasets
- ✅ Caching frequently accessed data
- ✅ Denormalization where appropriate

### Future Scalability
- 🔄 Redis caching layer
- 🔄 Cloud Functions for background jobs
- 🔄 Cloud CDN for static assets
- 🔄 Load balancing (auto-scaled by Vercel)
- 🔄 Database sharding (Firestore auto-handles)

---

## 🛠️ Development Workflow

### Local Development
```bash
1. Clone repository
2. npm install
3. Configure Firebase credentials
4. npm run dev
5. Access http://localhost:3000
```

### Deployment Pipeline
```
Code Changes
    ↓
Git Commit
    ↓
Push to GitHub
    ↓
Vercel Auto-Deploy (CI/CD)
    ↓
Build & Test
    ↓
Production Deployment
    ↓
Live URL Update
```

---

## 📊 Monitoring & Analytics

### System Monitoring
- Firebase Console (usage, errors)
- Vercel Analytics (performance)
- Browser DevTools (debugging)

### User Analytics
- Firebase Analytics (optional)
- User behavior tracking
- Performance metrics

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Real-time chat (Firestore listeners)
- [ ] Advanced search & filters
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration (live)
- [ ] AI chatbot support
- [ ] Inventory management system
- [ ] Multi-language support

### Technical Improvements
- [ ] GraphQL API layer
- [ ] Microservices architecture
- [ ] Machine learning price predictions
- [ ] Blockchain for supply chain tracking
- [ ] Progressive Web App (PWA)

---

## 📝 Notes

### Development Principles
- **Mobile-First Design**: Responsive on all devices
- **User-Centric**: Intuitive UI/UX
- **Performance**: Fast load times
- **Security**: Data protection priority
- **Scalability**: Built to grow
- **Maintainability**: Clean, documented code

### Best Practices
- Component reusability
- Type safety (TypeScript)
- Error handling
- Input validation
- Security rules testing
- Code reviews
- Version control

---

**Last Updated**: November 16, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

