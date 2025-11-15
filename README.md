# 🌾 HarvestHub - Agricultural Marketplace Platform

An agricultural marketplace connecting farmers directly with consumers. Features include intelligent price forecasting, geospatial mapping, digital wallet system, and community knowledge hub.

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![Firebase](https://img.shields.io/badge/Firebase-12.3.0-orange)

---

## ✨ Key Features

- 💰 **Price Forecasting** - Predict product prices and demand
- 🗺️ **Geospatial Mapping** - Find nearby farmers with interactive maps
- 💳 **Digital Wallet** - Cashless payment system (GCash/PayPal ready)
- 🌱 **Community Hub** - Share knowledge and connect with farmers
- 📦 **Order Management** - Complete marketplace with tracking
- 📊 **Market Analytics** - DA Philippines price integration

---

## 🚀 Setup Instructions

### Prerequisites

Before starting, ensure you have:
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm**, yarn, pnpm, or bun package manager
- **Git** ([Download](https://git-scm.com/))
- **Firebase Account** ([Sign up free](https://firebase.google.com/))

### Step 1: Clone the Repository

```bash
git clone https://github.com/Galowss/HarvestHub.git
cd harvest-hub
```

### Step 2: Install Dependencies

This project uses the following npm packages:

```bash
npm install
```

**Core Dependencies:**
```json
{
  "next": "15.5.4",                    // React framework
  "react": "19.1.0",                   // UI library
  "react-dom": "19.1.0",               // React DOM renderer
  "firebase": "^12.3.0",               // Backend services
  "leaflet": "^1.9.4",                 // Interactive maps
  "react-leaflet": "^5.0.0",           // React wrapper for Leaflet
  "@radix-ui/react-dialog": "^1.1.15", // Modal components
  "@radix-ui/react-slot": "^1.2.3",    // Slot component
  "axios": "^1.13.2",                  // HTTP client
  "class-variance-authority": "^0.7.1", // CSS utilities
  "clsx": "^2.1.1",                    // Class name utility
  "lucide-react": "^0.544.0",          // Icons
  "tailwind-merge": "^3.3.1"           // Tailwind utilities
}
```

**Dev Dependencies:**
```json
{
  "typescript": "^5",                  // TypeScript support
  "@types/node": "^20",                // Node.js types
  "@types/react": "^19",               // React types
  "@types/react-dom": "^19",           // React DOM types
  "@types/leaflet": "^1.9.20",         // Leaflet types
  "tailwindcss": "^4",                 // CSS framework
  "@tailwindcss/postcss": "^4",        // PostCSS integration
  "eslint": "^9",                      // Linting
  "eslint-config-next": "15.5.4",      // Next.js ESLint config
  "tw-animate-css": "^1.4.0"           // Tailwind animations
}
```

### Step 3: Firebase Configuration

#### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `HarvestHub` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

#### 3.2 Enable Firebase Services

**Enable Authentication:**
1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

**Enable Firestore Database:**
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your preferred location (e.g., `asia-southeast1`)
5. Click "Enable"

**Enable Storage (Optional - for images):**
1. Go to **Storage**
2. Click "Get started"
3. Start in production mode
4. Click "Done"

#### 3.3 Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ → **Project settings**
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register your app (name: `HarvestHub Web`)
5. Copy the Firebase configuration object

#### 3.4 Update Firebase Config File

Open `app/config/firebase.ts` and update with your credentials:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Step 4: Configure Firestore Database

#### 4.1 Create Collections

In Firestore Console, create these collections (they will be auto-created on first use, but you can create them manually):

- `users` - User profiles and roles
- `products` - Farmer product listings
- `orders` - Order transactions
- `transactions` - Wallet transactions
- `community_posts` - Community posts
- `community_comments` - Post comments

#### 4.2 Set Firestore Security Rules

In Firebase Console → Firestore Database → Rules tab, paste:

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
      allow create: if request.auth != null && 
                       request.resource.data.farmerId == request.auth.uid;
      allow update, delete: if request.auth.uid == resource.data.farmerId;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId ||
                     request.auth.uid == resource.data.farmerId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update: if request.auth.uid == resource.data.farmerId ||
                       request.auth.uid == resource.data.userId;
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Community posts
    match /community_posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }
    
    // Community comments
    match /community_comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.authorId;
    }
  }
}
```

Click **Publish** to save the rules.

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the System

### Create Test Accounts

1. **Sign up as Farmer:**
   - Go to `/signup`
   - Email: `farmer@test.com`
   - Password: `test123456`
   - Role: Select "Farmer"

2. **Sign up as User:**
   - Go to `/signup`
   - Email: `user@test.com`
   - Password: `test123456`
   - Role: Select "User"

### Add Farmer Location (Firebase Console)

1. Go to Firebase Console → Firestore Database
2. Find the `users` collection
3. Find your farmer document
4. Click "Add field" and add:
   ```
   Field: location
   Type: map
   
   Add nested fields:
   - lat (number): 14.5995
   - lng (number): 120.9842
   - address (string): "Quezon City, Metro Manila"
   ```

### Test Features

**As Farmer:**
- ✅ Add products with images
- ✅ View AI price forecasts (`/dashboard/farmer/pricing`)
- ✅ Check market analytics
- ✅ Manage orders
- ✅ Check wallet balance

**As User:**
- ✅ Browse products
- ✅ Add to cart
- ✅ Place order
- ✅ View nearby farmers on map
- ✅ Top up wallet

**Community (Both roles):**
- ✅ Create posts
- ✅ Like and comment
- ✅ Search content

---

## 📁 Project Structure

```
harvest-hub/
├── app/
│   ├── components/          # Reusable components
│   ├── config/
│   │   └── firebase.ts      # Firebase configuration
│   ├── dashboard/
│   │   ├── farmer/          # Farmer pages
│   │   │   ├── orders/      # Order management
│   │   │   ├── pricing/     # AI price forecasting
│   │   │   └── wallet/      # Farmer wallet
│   │   ├── user/            # User pages
│   │   │   ├── cart/        # Shopping cart
│   │   │   ├── orders/      # Order tracking
│   │   │   └── wallet/      # User wallet
│   │   ├── community/       # Community hub
│   │   └── map/             # Farmer map
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/              # Shared UI components
├── hooks/                   # Custom React hooks
├── lib/
│   ├── marketData.ts        # AI forecasting logic
│   ├── dateUtils.ts
│   └── utils.ts
├── public/                  # Static assets
├── readmefiles/             # Documentation
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

---

## 🌐 Environment Variables (Optional)

Create `.env.local` in the root directory:

```bash
# Google Maps API (if using Google Maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Payment Gateway (Production)
NEXT_PUBLIC_GCASH_CLIENT_ID=your_gcash_client_id
GCASH_CLIENT_SECRET=your_gcash_secret

NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🐛 Common Issues & Solutions

### Issue: "Firebase app not initialized"
**Solution:** Check `app/config/firebase.ts` has correct credentials

### Issue: Map not loading
**Solution:** 
- Leaflet CSS is imported in the MapComponent
- Check browser console for errors
- Ensure internet connection for OpenStreetMap tiles

### Issue: "Permission denied" in Firestore
**Solution:** Check Firestore security rules are deployed correctly

### Issue: Images not displaying
**Solution:** Check base64 encoding is working, or configure Firebase Storage

---

## 📚 Documentation

Comprehensive documentation available in `/readmefiles/`:

- `SETUP_CHECKLIST.md` - Complete setup guide
- `AI_FORECASTING_DOCUMENTATION.md` - AI system details
- `GEO_MAPPING_DOCUMENTATION.md` - Mapping features
- `DIGITAL_WALLET_SYSTEM.md` - Payment system
- `COMMUNITY_HUB_STATUS.md` - Community features
- `ADVANCED_INNOVATIVE_FEATURES.md` - Feature overview
- `EMERGING_TECHNOLOGY_INTEGRATION.md` - Technology stack

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add environment variables (if any)
7. Click "Deploy"

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

---

## 🛡️ Security Features

- ✅ Firebase Authentication (JWT)
- ✅ Firestore Security Rules
- ✅ HTTPS encryption
- ✅ Input validation
- ✅ XSS prevention
- ✅ Role-based access control

---

## 🎯 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| UI/Styling | Tailwind CSS 4, Radix UI |
| Backend | Firebase (Auth, Firestore, Storage) |
| Maps | Leaflet.js, OpenStreetMap |
| Icons | Lucide React |
| AI/Analytics | Custom time-series forecasting |

---

## 📞 Support & Resources

- **Documentation**: Check `/readmefiles/` folder
- **Issues**: [GitHub Issues](https://github.com/Galowss/HarvestHub/issues)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Leaflet Docs**: [leafletjs.com](https://leafletjs.com/)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Next.js team for the framework
- Firebase for backend services
- Leaflet.js for mapping
- OpenStreetMap for map tiles
- DA Philippines for agricultural data

---

**Version**: 1.0.0  
**Last Updated**: November 15, 2025  
**Status**: ✅ Production Ready

**Made with ❤️ for Filipino Farmers**
