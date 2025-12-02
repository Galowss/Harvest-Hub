# API & Data Flow Documentation - Harvest Hub

**Project:** Harvest Hub - Agricultural Marketplace Platform  
**Date:** December 2, 2025  
**Technology Stack:** Next.js 15, Firebase/Firestore, TypeScript, React 19

---

## Table of Contents
1. [Third-Party API Source](#third-party-api-source)
2. [API Endpoints & Methods](#api-endpoints--methods)
3. [React Query Implementation](#react-query-implementation)
4. [Data Structure & Schema](#data-structure--schema)
5. [Authentication Flow](#authentication-flow)
6. [Error Handling](#error-handling)

---

## 1. Third-Party API Source

### Firebase Configuration
**Source:** Google Firebase (Cloud Firestore + Firebase Authentication)

**Configuration Details:**
- **API Key:** AIzaSyAv5iyGz1zYwW_bFvg92VWagINcHjNNiSU
- **Auth Domain:** harvesthub-fe2bd.firebaseapp.com
- **Project ID:** harvesthub-fe2bd
- **Storage Bucket:** harvesthub-fe2bd.firebasestorage.app
- **Messaging Sender ID:** 822206956687
- **App ID:** 1:822206956687:web:a6477536c192798f0c9cfa
- **Measurement ID:** G-84282FEHBV

**Services Used:**
- Firebase Authentication (Email/Password)
- Cloud Firestore (NoSQL Database)
- Firebase Storage (File Storage)
- Offline Persistence (Multi-tab IndexedDB)

**Implementation:** `app/config/firebase.ts`

---

## 2. API Endpoints & Methods

### Overview
The system uses **Firebase Firestore SDK** for all database operations. There are no traditional REST API endpoints; instead, Firestore provides real-time database operations through its SDK.

### 2.1 Authentication Endpoints

#### **User Registration (Signup)**

**Method:** `createUserWithEmailAndPassword()`  
**Location:** `app/signup/page.tsx`, `app/signup/farmer/page.tsx`

**Request Parameters:**
```typescript
{
  email: string,
  password: string
}
```

**Process Flow:**
1. Create authentication account
2. Create user document in `users` collection
3. Redirect based on role

**Response Body:**
```typescript
{
  userCredential: {
    user: {
      uid: string,
      email: string
    }
  }
}
```

**Status Codes:**
- Success: Authentication object returned
- Error: Firebase Auth error thrown

---

#### **User Login**

**Method:** `signInWithEmailAndPassword()`  
**Location:** `app/login/page.tsx`

**Request Parameters:**
```typescript
{
  email: string,
  password: string
}
```

**Process Flow:**
1. Authenticate user credentials
2. Fetch user document from Firestore
3. Redirect based on user role (admin/farmer/user)

**Response Body:**
```typescript
{
  userCredential: {
    user: {
      uid: string,
      email: string
    }
  }
}
```

**Status Codes:**
- Success: User object with role information
- Error: Firebase Auth error (invalid credentials, user not found, etc.)

---

#### **User Logout**

**Method:** `signOut()`  
**Location:** `hooks/useLogout.tsx`

**Request Parameters:** None

**Response:** Redirects to login page

---

### 2.2 User Management Endpoints

#### **Get User Document**

**Method:** `getDoc(doc(db, "users", userId))`  
**Collection:** `users`

**Request Parameters:**
```typescript
{
  userId: string (Firebase Auth UID)
}
```

**Response Body:**
```typescript
{
  id: string,
  email: string,
  name?: string,
  role: "user" | "farmer" | "admin",
  createdAt: Timestamp,
  location?: {
    lat: number,
    lng: number,
    address?: string
  },
  profilePhoto?: string
}
```

**Status Codes:**
- Success: Document data returned
- Error: Document not found or permission denied

---

#### **Get All Users (Admin Only)**

**Method:** `getDocs(collection(db, "users"))`  
**Location:** `app/dashboard/admin/page.tsx`

**Request Parameters:** None (queries all users)

**Response Body:**
```typescript
Array<{
  id: string,
  email: string,
  name?: string,
  role: string,
  createdAt: Timestamp
}>
```

**Status Codes:**
- Success: Array of user documents
- Error: Permission denied if not admin

---

### 2.3 Product Management Endpoints

#### **Get All Products**

**Method:** `getDocs(collection(db, "products"))`  
**Location:** `app/dashboard/user/page.tsx`, `app/dashboard/admin/page.tsx`

**Request Parameters:** None

**Query Options:** Can filter by category, farmer, availability

**Response Body:**
```typescript
Array<{
  id: string,
  name: string,
  description: string,
  category: string,
  price: number,
  quantity: number,
  stock?: number,
  harvestDate: string,
  images: string[],
  farmerId: string,
  farmerName?: string,
  createdAt: Timestamp
}>
```

**Status Codes:**
- Success: Array of product documents
- Error: Query failed or permission denied

---

#### **Add New Product (Farmer)**

**Method:** `addDoc(collection(db, "products"), productData)`  
**Location:** `app/dashboard/farmer/page.tsx`

**Request Parameters:**
```typescript
{
  name: string,
  description: string,
  category: string,
  price: string | number,
  quantity: string | number,
  harvestDate: string,
  images: string[],
  farmerId: string
}
```

**Response Body:**
```typescript
{
  id: string (auto-generated document ID)
}
```

**Status Codes:**
- Success: Document created with generated ID
- Error: Validation error or permission denied

---

#### **Update Product (Farmer)**

**Method:** `updateDoc(doc(db, "products", productId), updates)`  
**Location:** `app/dashboard/farmer/page.tsx`

**Request Parameters:**
```typescript
{
  productId: string,
  updates: {
    name?: string,
    description?: string,
    category?: string,
    price?: number,
    quantity?: number,
    harvestDate?: string,
    images?: string[]
  }
}
```

**Response:** Update successful (no return value)

**Status Codes:**
- Success: Document updated
- Error: Document not found or permission denied

---

#### **Delete Product (Farmer/Admin)**

**Method:** `deleteDoc(doc(db, "products", productId))`  
**Location:** `app/dashboard/farmer/page.tsx`, `app/dashboard/admin/page.tsx`

**Request Parameters:**
```typescript
{
  productId: string
}
```

**Response:** Deletion successful (no return value)

**Status Codes:**
- Success: Document deleted
- Error: Document not found or permission denied

---

### 2.4 Cart Management Endpoints

#### **Get Cart Items**

**Method:** `getDocs(query(collection(db, "cart"), where("userId", "==", userId)))`  
**Location:** `app/dashboard/user/cart/page.tsx`

**Request Parameters:**
```typescript
{
  userId: string
}
```

**Response Body:**
```typescript
Array<{
  id: string,
  userId: string,
  productId: string,
  farmerId: string,
  name: string,
  price: number,
  quantity: number,
  photo?: string,
  addedAt: Timestamp
}>
```

**Status Codes:**
- Success: Array of cart items
- Error: Query failed or permission denied

---

#### **Add to Cart**

**Method:** `addDoc(collection(db, "cart"), cartItem)`  
**Location:** `app/dashboard/user/page.tsx`

**Request Parameters:**
```typescript
{
  userId: string,
  productId: string,
  farmerId: string,
  name: string,
  price: number,
  quantity: number,
  photo?: string,
  addedAt: Timestamp
}
```

**Response Body:**
```typescript
{
  id: string (auto-generated cart item ID)
}
```

**Status Codes:**
- Success: Cart item added
- Error: Validation error or permission denied

---

#### **Remove from Cart**

**Method:** `deleteDoc(doc(db, "cart", cartItemId))`  
**Location:** `app/dashboard/user/cart/page.tsx`

**Request Parameters:**
```typescript
{
  cartItemId: string
}
```

**Response:** Deletion successful

**Status Codes:**
- Success: Item removed from cart
- Error: Item not found or permission denied

---

### 2.5 Order Management Endpoints

#### **Create Order**

**Method:** `addDoc(collection(db, "orders"), orderData)`  
**Location:** `app/dashboard/user/order-summary/page.tsx`

**Request Parameters:**
```typescript
{
  buyerId: string,
  farmerId: string,
  productId: string,
  name: string,
  price: number,
  quantity: number,
  photo?: string,
  status: "pending",
  createdAt: Timestamp,
  deliveryOption: "delivery" | "pickup",
  paymentMethod: "cod" | "wallet",
  paymentStatus: "pending" | "completed",
  
  // If delivery
  deliveryAddress?: string,
  deliveryDate?: string,
  deliveryTime?: string,
  deliveryDateTime?: Timestamp,
  deliveryLocation?: {
    lat: number,
    lng: number
  },
  requiresDelivery?: boolean,
  
  // If pickup
  pickupDate?: string,
  pickupTime?: string,
  pickupDateTime?: Timestamp
}
```

**Response Body:**
```typescript
{
  id: string (auto-generated order ID)
}
```

**Status Codes:**
- Success: Order created
- Error: Validation error or permission denied

---

#### **Get User Orders**

**Method:** `getDocs(query(collection(db, "orders"), where("buyerId", "==", userId)))`  
**Location:** `app/dashboard/user/orders/page.tsx`

**Request Parameters:**
```typescript
{
  buyerId: string
}
```

**Response Body:**
```typescript
Array<{
  id: string,
  buyerId: string,
  farmerId: string,
  productId: string,
  name: string,
  price: number,
  quantity: number,
  status: "pending" | "out-for-delivery" | "completed" | "cancelled",
  reviewed?: boolean,
  productImage?: string,
  trackingNumber?: string,
  deliveryStatus?: string,
  deliveryStartedAt?: Timestamp,
  deliveredAt?: Timestamp,
  createdAt: Timestamp
}>
```

**Status Codes:**
- Success: Array of orders
- Error: Query failed or permission denied

---

#### **Get Farmer Orders**

**Method:** `getDocs(query(collection(db, "orders"), where("farmerId", "==", farmerId)))`  
**Location:** `app/dashboard/farmer/orders/page.tsx`

**Request Parameters:**
```typescript
{
  farmerId: string
}
```

**Response Body:**
```typescript
Array<{
  id: string,
  buyerId: string,
  buyerEmail: string,
  farmerId: string,
  productId: string,
  name: string,
  productImage?: string,
  price: number,
  quantity: number,
  status: string,
  deliveryOption?: string,
  deliveryAddress?: string,
  createdAt: Timestamp
}>
```

**Status Codes:**
- Success: Array of orders for the farmer
- Error: Query failed or permission denied

---

#### **Update Order Status**

**Method:** `updateDoc(doc(db, "orders", orderId), { status, ...otherFields })`  
**Location:** `app/dashboard/farmer/orders/page.tsx`

**Request Parameters:**
```typescript
{
  orderId: string,
  status: "pending" | "out-for-delivery" | "completed" | "cancelled",
  trackingNumber?: string,
  deliveryStatus?: string,
  deliveryStartedAt?: Timestamp,
  deliveredAt?: Timestamp
}
```

**Response:** Update successful

**Status Codes:**
- Success: Order status updated
- Error: Order not found or permission denied

---

### 2.6 Wallet Management Endpoints

#### **Get Wallet Balance**

**Method:** `getDoc(doc(db, "wallets", userId))`  
**Location:** `app/dashboard/user/wallet/page.tsx`, `app/dashboard/farmer/wallet/page.tsx`

**Request Parameters:**
```typescript
{
  userId: string
}
```

**Response Body:**
```typescript
{
  balance: number,
  userId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Status Codes:**
- Success: Wallet data returned
- Error: Document not found (wallet auto-created if missing)

---

#### **Create/Initialize Wallet**

**Method:** `setDoc(doc(db, "wallets", userId), walletData)`  
**Location:** `app/dashboard/user/wallet/page.tsx`

**Request Parameters:**
```typescript
{
  userId: string,
  balance: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Response:** Wallet created

**Status Codes:**
- Success: Wallet initialized
- Error: Permission denied

---

#### **Update Wallet Balance**

**Method:** `updateDoc(doc(db, "wallets", userId), { balance: increment(amount) })`  
**Location:** `app/dashboard/user/order-summary/page.tsx`, `app/dashboard/user/wallet/page.tsx`

**Request Parameters:**
```typescript
{
  userId: string,
  amount: number (positive for credit, negative for debit)
}
```

**Response:** Balance updated

**Status Codes:**
- Success: Balance updated atomically
- Error: Insufficient balance or permission denied

---

#### **Get Wallet Transactions**

**Method:** `getDocs(query(collection(db, "wallet_transactions"), where("userId", "==", userId), orderBy("createdAt", "desc")))`  
**Location:** `app/dashboard/user/wallet/page.tsx`

**Request Parameters:**
```typescript
{
  userId: string
}
```

**Response Body:**
```typescript
Array<{
  id: string,
  userId: string,
  type: "topup" | "payment" | "refund" | "credit" | "debit",
  amount: number,
  description: string,
  status: "completed" | "pending" | "failed",
  createdAt: Timestamp,
  orderId?: string
}>
```

**Status Codes:**
- Success: Array of transactions
- Error: Query failed or permission denied

---

#### **Create Wallet Transaction**

**Method:** `addDoc(collection(db, "wallet_transactions"), transactionData)`  
**Location:** `app/dashboard/user/order-summary/page.tsx`, `app/dashboard/user/wallet/page.tsx`

**Request Parameters:**
```typescript
{
  userId: string,
  type: "topup" | "payment" | "refund",
  amount: number,
  description: string,
  status: "completed" | "pending",
  createdAt: Timestamp,
  orderId?: string
}
```

**Response Body:**
```typescript
{
  id: string (auto-generated transaction ID)
}
```

**Status Codes:**
- Success: Transaction recorded
- Error: Validation error or permission denied

---

### 2.7 Community Hub Endpoints

#### **Get Community Posts**

**Method:** `getDocs(query(collection(db, "community_posts"), orderBy("createdAt", "desc"), limit(100)))`  
**Location:** `app/dashboard/community/page.tsx`

**Request Parameters:** None

**Query Options:** Can filter by category, search terms

**Response Body:**
```typescript
Array<{
  id: string,
  title: string,
  content: string,
  category: "tip" | "success-story" | "question" | "discussion",
  author: string,
  authorId: string,
  authorRole: "farmer" | "user",
  likes: number,
  comments: number,
  createdAt: Timestamp,
  tags: string[]
}>
```

**Status Codes:**
- Success: Array of posts
- Error: Query failed or permission denied

---

#### **Create Community Post**

**Method:** `addDoc(collection(db, "community_posts"), postData)`  
**Location:** `app/dashboard/community/page.tsx`

**Request Parameters:**
```typescript
{
  title: string,
  content: string,
  category: "tip" | "success-story" | "question" | "discussion",
  author: string,
  authorId: string,
  authorRole: "farmer" | "user",
  likes: 0,
  comments: 0,
  createdAt: Timestamp,
  tags: string[]
}
```

**Response Body:**
```typescript
{
  id: string (auto-generated post ID)
}
```

**Status Codes:**
- Success: Post created
- Error: Validation error or permission denied

---

#### **Like/Unlike Post**

**Method:** `updateDoc(doc(db, "community_posts", postId), { likes: increment(1) })`  
**Location:** `app/dashboard/community/page.tsx`

**Request Parameters:**
```typescript
{
  postId: string,
  increment: 1 | -1
}
```

**Response:** Likes count updated

**Status Codes:**
- Success: Post liked/unliked
- Error: Post not found or permission denied

---

#### **Get Post Comments**

**Method:** `getDocs(query(collection(db, "comments"), where("postId", "==", postId), orderBy("createdAt", "desc")))`  
**Location:** `app/dashboard/community/page.tsx`

**Request Parameters:**
```typescript
{
  postId: string
}
```

**Response Body:**
```typescript
Array<{
  id: string,
  postId: string,
  content: string,
  author: string,
  authorId: string,
  createdAt: Timestamp
}>
```

**Status Codes:**
- Success: Array of comments
- Error: Query failed or permission denied

---

#### **Add Comment**

**Method:** `addDoc(collection(db, "comments"), commentData)`  
**Location:** `app/dashboard/community/page.tsx`

**Request Parameters:**
```typescript
{
  postId: string,
  content: string,
  author: string,
  authorId: string,
  createdAt: Timestamp
}
```

**Response Body:**
```typescript
{
  id: string (auto-generated comment ID)
}
```

**Status Codes:**
- Success: Comment added
- Error: Validation error or permission denied

---

### 2.8 Rating & Review Endpoints

#### **Get Farmer Ratings**

**Method:** `getDocs(query(collection(db, "ratings"), where("farmerId", "==", farmerId)))`  
**Location:** `app/dashboard/user/rate-farmer/[farmerId]/page.tsx`

**Request Parameters:**
```typescript
{
  farmerId: string
}
```

**Response Body:**
```typescript
Array<{
  id: string,
  farmerId: string,
  buyerId: string,
  buyerName: string,
  rating: number (1-5),
  comment: string,
  createdAt: Timestamp
}>
```

**Status Codes:**
- Success: Array of ratings
- Error: Query failed or permission denied

---

#### **Submit Rating**

**Method:** `addDoc(collection(db, "ratings"), ratingData)`  
**Location:** `app/dashboard/user/orders/page.tsx`

**Request Parameters:**
```typescript
{
  farmerId: string,
  buyerId: string,
  buyerName: string,
  orderId: string,
  rating: number (1-5),
  comment: string,
  createdAt: Timestamp
}
```

**Response Body:**
```typescript
{
  id: string (auto-generated rating ID)
}
```

**Status Codes:**
- Success: Rating submitted
- Error: Validation error or permission denied

---

### 2.9 Notification Endpoint

#### **Send Notification (Currently Disabled)**

**Method:** `POST`  
**Endpoint:** `/api/send-notification`  
**Location:** `app/api/send-notification/route.ts`

**Request Parameters:**
```typescript
{
  // Email notification parameters (implementation pending)
}
```

**Response Body:**
```typescript
{
  success: false,
  message: "Email notifications are currently disabled"
}
```

**Status Code:** `501 Not Implemented`

---

## 3. React Query Implementation

### Current Implementation Status: **NOT IMPLEMENTED**

**Analysis:** The Harvest Hub system **does NOT use React Query**. Instead, it uses:

1. **Direct Firestore SDK calls** within component effects
2. **Firebase onAuthStateChanged** for authentication state
3. **Local state management** with React useState
4. **Manual data fetching** in useEffect hooks

### Current Data Fetching Pattern

```typescript
// Example from app/dashboard/user/page.tsx
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setUser({ id: currentUser.uid, ...docSnap.data() });
      fetchProducts();
    }
  });

  return () => unsubscribe();
}, [router]);
```

### State Management Approach

**Provider:** No global state provider (Context API or Redux)

**Query Keys:** Not applicable (no React Query)

**Error Handling:**
- Try-catch blocks around Firestore operations
- Alert dialogs for user-facing errors
- Console.error for debugging
- Manual loading states with useState

```typescript
// Typical error handling pattern
try {
  const q = query(collection(db, "orders"), where("buyerId", "==", userId));
  const querySnapshot = await getDocs(q);
  const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setOrders(orders);
} catch (err) {
  console.error("Error fetching orders:", err);
  alert("Failed to load orders. Please try again.");
} finally {
  setLoading(false);
}
```

### Alternative to React Query

**Firebase Real-time Listeners:**
The system could be enhanced to use Firestore's real-time listeners for automatic updates:

```typescript
// Potential implementation (not currently used)
import { onSnapshot } from "firebase/firestore";

useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, "products")),
    (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(products);
    },
    (error) => {
      console.error("Error listening to products:", error);
    }
  );

  return () => unsubscribe();
}, []);
```

---

## 4. Data Structure & Schema

### 4.1 Users Collection (`users`)

**Document ID:** Firebase Auth UID

```typescript
{
  id: string,              // Firebase Auth UID
  email: string,           // User email
  name?: string,           // Display name
  role: "user" | "farmer" | "admin",
  createdAt: Timestamp,
  location?: {             // User's saved location
    lat: number,
    lng: number,
    address?: string
  },
  profilePhoto?: string,   // Profile image URL
  displayName?: string     // Alternative display name
}
```

**Indexes Required:**
- `role` (for filtering by user type)
- `email` (for searching users)

---

### 4.2 Products Collection (`products`)

**Document ID:** Auto-generated by Firestore

```typescript
{
  id: string,                    // Auto-generated document ID
  name: string,                  // Product name
  description: string,           // Product description
  category: string,              // Product category
  price: number,                 // Price per unit
  quantity: number,              // Available quantity
  stock?: number,                // Current stock level
  harvestDate: string,           // Harvest date (ISO format)
  images: string[],              // Array of image URLs
  farmerId: string,              // Reference to farmer's user ID
  farmerName?: string,           // Farmer's name (denormalized)
  createdAt: Timestamp,          // Creation timestamp
  updatedAt?: Timestamp          // Last update timestamp
}
```

**Indexes Required:**
- `farmerId` (for farmer's product queries)
- `category` (for filtering by category)
- `createdAt` (for sorting)

---

### 4.3 Cart Collection (`cart`)

**Document ID:** Auto-generated by Firestore

```typescript
{
  id: string,              // Auto-generated document ID
  userId: string,          // Reference to buyer's user ID
  productId: string,       // Reference to product document
  farmerId: string,        // Reference to farmer's user ID
  name: string,            // Product name (denormalized)
  price: number,           // Product price (snapshot at add time)
  quantity: number,        // Quantity in cart
  photo?: string,          // Product image URL (denormalized)
  addedAt: Timestamp       // When added to cart
}
```

**Indexes Required:**
- `userId` (for user's cart queries)
- Compound: `userId` + `addedAt` (for sorted cart items)

---

### 4.4 Orders Collection (`orders`)

**Document ID:** Auto-generated by Firestore

```typescript
{
  id: string,                    // Auto-generated document ID
  buyerId: string,               // Reference to buyer's user ID
  buyerName?: string,            // Buyer name (denormalized)
  farmerId: string,              // Reference to farmer's user ID
  farmerName?: string,           // Farmer name (denormalized)
  productId: string,             // Reference to product
  name: string,                  // Product name
  productImage?: string,         // Product image URL
  price: number,                 // Price at order time
  quantity: number,              // Ordered quantity
  status: "pending" | "out-for-delivery" | "completed" | "cancelled",
  reviewed?: boolean,            // Whether buyer reviewed this order
  createdAt: Timestamp,          // Order creation time
  
  // Payment
  paymentMethod: "cod" | "wallet",
  paymentStatus: "pending" | "completed",
  
  // Delivery
  deliveryOption: "delivery" | "pickup",
  requiresDelivery?: boolean,
  
  // If delivery option
  deliveryAddress?: string,
  deliveryDate?: string,
  deliveryTime?: string,
  deliveryDateTime?: Timestamp,
  deliveryLocation?: {
    lat: number,
    lng: number
  },
  trackingNumber?: string,
  deliveryStatus?: string,
  deliveryStartedAt?: Timestamp,
  deliveredAt?: Timestamp,
  
  // If pickup option
  pickupDate?: string,
  pickupTime?: string,
  pickupDateTime?: Timestamp
}
```

**Indexes Required:**
- `buyerId` (for buyer's order queries)
- `farmerId` (for farmer's order queries)
- Compound: `buyerId` + `createdAt` (for sorted buyer orders)
- Compound: `farmerId` + `createdAt` (for sorted farmer orders)
- `status` (for filtering by order status)

**Firestore Index Definition:** `firestore.indexes.json`

---

### 4.5 Wallets Collection (`wallets`)

**Document ID:** User ID (Firebase Auth UID)

```typescript
{
  balance: number,           // Current wallet balance
  userId: string,            // Reference to user ID (same as doc ID)
  createdAt: Timestamp,      // Wallet creation time
  updatedAt: Timestamp       // Last update time
}
```

**Indexes Required:**
- None (queried by document ID)

---

### 4.6 Wallet Transactions Collection (`wallet_transactions`)

**Document ID:** Auto-generated by Firestore

```typescript
{
  id: string,                    // Auto-generated document ID
  userId: string,                // Reference to user ID
  type: "topup" | "payment" | "refund" | "credit" | "debit",
  amount: number,                // Transaction amount
  description: string,           // Transaction description
  status: "completed" | "pending" | "failed",
  createdAt: Timestamp,          // Transaction timestamp
  orderId?: string               // Reference to order (if applicable)
}
```

**Indexes Required:**
- Compound: `userId` + `createdAt` (for user transaction history)

---

### 4.7 Community Posts Collection (`community_posts`)

**Document ID:** Auto-generated by Firestore

```typescript
{
  id: string,                    // Auto-generated document ID
  title: string,                 // Post title
  content: string,               // Post content
  category: "tip" | "success-story" | "question" | "discussion",
  author: string,                // Author name
  authorId: string,              // Reference to user ID
  authorRole: "farmer" | "user", // Author's role
  likes: number,                 // Like count
  comments: number,              // Comment count
  createdAt: Timestamp,          // Post creation time
  tags: string[]                 // Post tags
}
```

**Indexes Required:**
- Compound: `createdAt` (descending) for recent posts
- `category` (for filtering)
- `authorId` (for user's posts)

---

### 4.8 Comments Collection (`comments`)

**Document ID:** Auto-generated by Firestore

```typescript
{
  id: string,              // Auto-generated document ID
  postId: string,          // Reference to community post
  content: string,         // Comment content
  author: string,          // Author name
  authorId: string,        // Reference to user ID
  createdAt: Timestamp     // Comment timestamp
}
```

**Indexes Required:**
- Compound: `postId` + `createdAt` (for post comments)

---

### 4.9 Ratings Collection (`ratings`)

**Document ID:** Auto-generated by Firestore

```typescript
{
  id: string,              // Auto-generated document ID
  farmerId: string,        // Reference to farmer's user ID
  buyerId: string,         // Reference to buyer's user ID
  buyerName: string,       // Buyer's name
  orderId: string,         // Reference to order
  rating: number,          // Rating (1-5)
  comment: string,         // Review comment
  createdAt: Timestamp     // Rating timestamp
}
```

**Indexes Required:**
- `farmerId` (for farmer's ratings)
- Compound: `farmerId` + `createdAt` (for sorted ratings)
- Compound: `buyerId` + `orderId` (to prevent duplicate reviews)

---

## 5. Authentication Flow

### 5.1 User Registration Flow

```
1. User enters email + password
2. createUserWithEmailAndPassword(auth, email, password)
3. Create user document in Firestore:
   - setDoc(doc(db, "users", uid), {
       email,
       role: "user" | "farmer",
       createdAt: Timestamp.now()
     })
4. Redirect to appropriate dashboard
```

**Implementation:** `app/signup/page.tsx`, `app/signup/farmer/page.tsx`

---

### 5.2 Login Flow

```
1. User enters email + password
2. signInWithEmailAndPassword(auth, email, password)
3. Fetch user document from Firestore
4. Check user role
5. Redirect based on role:
   - admin -> /dashboard/admin
   - farmer -> /dashboard/farmer
   - user -> /dashboard/user
```

**Implementation:** `app/login/page.tsx`

---

### 5.3 Authentication State Management

```typescript
// Used across all protected pages
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    
    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      setUser({ id: currentUser.uid, ...userDoc.data() });
      // Load page-specific data
    }
  });
  
  return () => unsubscribe();
}, [router]);
```

**Persistence:** `browserLocalPersistence` (survives browser restarts)

**Offline Support:** Multi-tab IndexedDB persistence enabled

---

### 5.4 Authorization Checks

**Admin Pages:**
```typescript
// Verify user role is "admin"
const userDoc = await getDoc(doc(db, "users", user.uid));
if (!userDoc.exists() || userDoc.data().role !== "admin") {
  alert("Unauthorized access. Admin only.");
  router.push("/login");
  return;
}
```

**Farmer Pages:**
```typescript
// Verify user role is "farmer"
if (docSnap.exists() && docSnap.data().role === "farmer") {
  setUser({ id: currentUser.uid, ...docSnap.data() });
} else {
  router.push("/login");
}
```

**User Pages:**
```typescript
// Verify user role is "user"
if (docSnap.exists() && docSnap.data().role === "user") {
  setUser({ id: currentUser.uid, ...docSnap.data() });
} else {
  router.push("/login");
}
```

---

## 6. Error Handling

### 6.1 Error Handling Patterns

#### **Authentication Errors**

```typescript
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error: any) {
  if (error.code === 'auth/user-not-found') {
    alert('No user found with this email');
  } else if (error.code === 'auth/wrong-password') {
    alert('Incorrect password');
  } else {
    alert(`Error: ${error.message}`);
  }
}
```

**Common Auth Error Codes:**
- `auth/user-not-found`
- `auth/wrong-password`
- `auth/email-already-in-use`
- `auth/weak-password`
- `auth/invalid-email`

---

#### **Firestore Query Errors**

```typescript
try {
  const querySnapshot = await getDocs(collection(db, "products"));
  const products = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setProducts(products);
} catch (err) {
  console.error("Error fetching products:", err);
  alert("Failed to load products. Please check your Firestore rules.");
}
```

**Common Firestore Errors:**
- `permission-denied` (Firestore security rules)
- `not-found` (Document doesn't exist)
- `unavailable` (Network issues)
- `failed-precondition` (Index missing)

---

#### **Upload/Storage Errors**

```typescript
try {
  // Timeout wrapper for long operations
  await withTimeout(uploadOperation(), 60000);
} catch (error: any) {
  if (error.message.includes('timed out')) {
    alert('Upload timed out. Please check your internet connection.');
  } else {
    alert(`Upload failed: ${error.message}`);
  }
}
```

---

### 6.2 Loading States

**Pattern used throughout the application:**

```typescript
const [loading, setLoading] = useState(true);
const [processing, setProcessing] = useState(false);

// Initial load
useEffect(() => {
  loadData().finally(() => setLoading(false));
}, []);

// Action processing
const handleAction = async () => {
  setProcessing(true);
  try {
    await performAction();
  } finally {
    setProcessing(false);
  }
};
```

---

### 6.3 User Feedback

**Alert Dialogs:**
```typescript
alert("Order placed successfully!");
alert("Error placing order. Please try again.");
```

**Console Logging:**
```typescript
console.log("Fetching cart for user:", userId);
console.error("Error fetching cart items:", err);
console.warn("Browser doesn't support offline persistence");
```

**Loading Indicators:**
```typescript
{loading ? (
  <div className="flex h-screen items-center justify-center">
    <p>Loading...</p>
  </div>
) : (
  <div>{/* Content */}</div>
)}
```

---

## Summary

### Key Technologies
- **Database:** Firebase Firestore (NoSQL, real-time)
- **Authentication:** Firebase Authentication (Email/Password)
- **Storage:** Firebase Storage (for images)
- **State Management:** React useState + useEffect
- **Routing:** Next.js App Router
- **Type Safety:** TypeScript interfaces

### Data Flow Pattern
1. User authenticates via Firebase Auth
2. Components fetch data directly from Firestore on mount
3. Data is stored in local component state
4. User actions trigger Firestore write operations
5. UI updates reflect changes manually

### No React Query
The system uses direct Firebase SDK calls without React Query. This means:
- No centralized cache management
- No automatic refetching
- Manual loading states
- No optimistic updates
- Simple error handling with try-catch

### Potential Improvements
1. Implement React Query for better data caching
2. Use Firestore real-time listeners for automatic updates
3. Add centralized error handling
4. Implement optimistic UI updates
5. Add request deduplication
6. Improve TypeScript type definitions

---

**End of Documentation**
