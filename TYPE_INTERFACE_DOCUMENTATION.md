# Type/Interface Documentation - Harvest Hub

**Course Assignment:** Type/Interface Documentation  
**Project:** Harvest Hub - Agricultural Marketplace Platform  
**Due Date:** December 5, 2025  
**Student:** [Your Name]

---

## Overview

This document provides a comprehensive reference for all TypeScript interfaces used in the Harvest Hub application, preventing misuse and ensuring type safety across the codebase.

---

## Table of Contents

1. [User Management Interfaces](#user-management-interfaces)
2. [Product Management Interfaces](#product-management-interfaces)
3. [Order Management Interfaces](#order-management-interfaces)
4. [Wallet & Transaction Interfaces](#wallet--transaction-interfaces)
5. [Community Hub Interfaces](#community-hub-interfaces)
6. [Map & Location Interfaces](#map--location-interfaces)
7. [Analytics Interfaces](#analytics-interfaces)
8. [Component Props Interfaces](#component-props-interfaces)

---

## 1. User Management Interfaces

### User Interface
**Location:** `app/dashboard/admin/page.tsx`, `app/dashboard/farmer/page.tsx`

```typescript
interface User {
  id: string;              // Unique user identifier (Firebase UID)
  email: string;           // User's email address
  name?: string;           // Optional display name
  role: string;            // User role: "user" | "farmer" | "admin"
  createdAt?: any;         // Timestamp of account creation
}
```

**Usage:**
- User authentication and authorization
- Profile management
- Role-based access control
- Admin user management panel

**Extended User Interface (Farmer Dashboard)**
```typescript
interface User {
  uid: string;             // Firebase authentication UID
  id: string;              // Document ID in Firestore
  email: string;           // User's email
  name?: string;           // Display name
  displayName?: string;    // Alternative display name from Firebase Auth
  profilePhoto?: string;   // URL to user's profile photo
}
```

**Usage:**
- Farmer profile display
- Product ownership verification
- Order tracking

---

## 2. Product Management Interfaces

### Product Interface (Admin View)
**Location:** `app/dashboard/admin/page.tsx`

```typescript
interface Product {
  id: string;              // Unique product identifier
  name: string;            // Product name
  price: number;           // Product price in PHP
  farmerId: string;        // ID of the farmer who posted this product
  farmerName?: string;     // Optional farmer's display name
  stock?: number;          // Available quantity
  category?: string;       // Product category
}
```

**Usage:**
- Admin product oversight
- Product listing management
- Inventory monitoring

### Product Interface (Farmer View)
**Location:** `app/dashboard/farmer/page.tsx`

```typescript
interface Product {
  id: string;                    // Unique product identifier
  name: string;                  // Product name (e.g., "Organic Tomatoes")
  description: string;           // Detailed product description
  category: string;              // Category (e.g., "Vegetables", "Fruits")
  price: string;                 // Price as string for input handling
  quantity: string;              // Stock quantity as string
  stock?: string;                // Alternative stock field
  harvestDate: string;           // Date when product was harvested
  images: string[];              // Array of base64 image strings
  existingImages?: string[];     // Existing images when editing
  newImages?: File[];            // New images to upload when editing
  farmerId: string;              // ID of farmer who owns this product
}
```

**Usage:**
- Creating new product listings
- Editing existing products
- Displaying product details
- Managing product images

### NewProduct Interface
**Location:** `app/dashboard/farmer/page.tsx`

```typescript
interface NewProduct {
  name: string;            // Product name
  description: string;     // Product description
  category: string;        // Product category
  price: string;           // Price (string for form input)
  quantity: string;        // Stock quantity (string for form input)
  harvestDate: string;     // Harvest date in ISO format
  images: File[];          // Array of image files to upload
}
```

**Usage:**
- Form data structure for adding new products
- Product creation validation
- Initial product submission

---

## 3. Order Management Interfaces

### Order Interface
**Location:** `app/dashboard/admin/page.tsx`, `app/dashboard/user/orders/page.tsx`

```typescript
interface Order {
  id: string;                    // Unique order identifier
  buyerId: string;               // ID of the user who placed the order
  buyerName?: string;            // Optional buyer's display name
  farmerId: string;              // ID of the farmer fulfilling the order
  farmerName?: string;           // Optional farmer's display name
  productName: string;           // Name of the ordered product
  quantity: number;              // Quantity ordered
  totalPrice: number;            // Total order price
  status: string;                // Order status (see below)
  createdAt?: any;               // Timestamp of order creation
  deliveryAddress?: string;      // Delivery address for the order
}
```

**Order Status Values:**
- `"pending"` - Order placed, awaiting farmer confirmation
- `"confirmed"` - Farmer confirmed the order
- `"preparing"` - Farmer is preparing the order
- `"out-for-delivery"` - Order is being delivered
- `"delivered"` - Order successfully delivered
- `"cancelled"` - Order was cancelled
- `"completed"` - Order completed and confirmed by user

**Usage:**
- Order tracking
- Order status updates
- Admin order management
- User order history

### ReviewModalState Interface
**Location:** `app/dashboard/user/orders/page.tsx`

```typescript
interface ReviewModalState {
  isOpen: boolean;         // Whether the review modal is open
  orderId: string;         // ID of the order being reviewed
  farmerId: string;        // ID of the farmer to review
  farmerName: string;      // Name of the farmer
}
```

**Usage:**
- Managing review submission modals
- Tracking which order is being reviewed
- Connecting reviews to farmers

---

## 4. Wallet & Transaction Interfaces

### Transaction Interface
**Location:** `app/dashboard/user/wallet/page.tsx`, `app/dashboard/farmer/wallet/page.tsx`

```typescript
interface Transaction {
  id: string;                          // Unique transaction identifier
  type: 'topup' | 'payment' | 'refund'; // Transaction type
  amount: number;                      // Transaction amount in PHP
  description: string;                 // Transaction description
  status: 'completed' | 'pending' | 'failed'; // Transaction status
  createdAt: any;                      // Timestamp of transaction
  orderId?: string;                    // Optional related order ID
}
```

**Transaction Types:**
- `topup` - User added money to wallet
- `payment` - Payment made for an order
- `refund` - Money refunded to wallet

**Usage:**
- Wallet transaction history
- Payment processing
- Refund management

### Wallet Interface
**Location:** `app/dashboard/user/wallet/page.tsx`

```typescript
interface Wallet {
  balance: number;         // Current wallet balance in PHP
  userId: string;          // ID of wallet owner
  createdAt: any;          // Wallet creation timestamp
  updatedAt: any;          // Last update timestamp
}
```

**Usage:**
- Displaying user's wallet balance
- Processing payments
- Managing wallet updates

### WalletData Interface (Farmer)
**Location:** `app/dashboard/farmer/wallet/page.tsx`

```typescript
interface WalletData {
  balance: number;              // Current balance
  totalEarnings: number;        // All-time earnings
  pendingPayouts: number;       // Earnings awaiting payout
  lastPayoutDate?: any;         // Last payout timestamp
}
```

**Usage:**
- Farmer earnings dashboard
- Payout management
- Financial reporting

---

## 5. Community Hub Interfaces

### Post Interface
**Location:** `app/dashboard/community/page.tsx`

```typescript
interface Post {
  id: string;                                    // Unique post identifier
  title: string;                                 // Post title
  content: string;                               // Post content/body
  category: "tip" | "success-story" | "question" | "discussion"; // Post category
  author: string;                                // Author's display name
  authorId: string;                              // Author's user ID
  authorRole: "farmer" | "user";                 // Author's role
  likes: number;                                 // Number of likes
  comments: number;                              // Number of comments
  createdAt: any;                                // Post creation timestamp
  tags: string[];                                // Array of tag strings
}
```

**Post Categories:**
- `tip` - Farming tips and advice
- `success-story` - Success stories from farmers
- `question` - Questions from community
- `discussion` - General discussions

**Usage:**
- Community post creation
- Post listing and filtering
- Social interaction tracking

### Comment Interface
**Location:** `app/dashboard/community/page.tsx`

```typescript
interface Comment {
  id: string;              // Unique comment identifier
  postId: string;          // ID of the post being commented on
  content: string;         // Comment text content
  author: string;          // Commenter's display name
  authorId: string;        // Commenter's user ID
  createdAt: any;          // Comment creation timestamp
}
```

**Usage:**
- Comment threads on posts
- User engagement tracking
- Community discussions

---

## 6. Map & Location Interfaces

### FarmerLocation Interface
**Location:** `app/dashboard/map/page.tsx`

```typescript
interface FarmerLocation {
  id: string;              // Farmer's unique ID
  name: string;            // Farmer's name
  email: string;           // Farmer's email
  location?: {
    lat: number;           // Latitude coordinate
    lng: number;           // Longitude coordinate
    address?: string;      // Optional human-readable address
  };
  products?: any[];        // Optional array of farmer's products
}
```

**Usage:**
- Displaying farmers on interactive map
- Location-based product searches
- Finding nearby farmers

### MapComponentProps Interface
**Location:** `app/dashboard/map/MapComponent.tsx`

```typescript
interface MapComponentProps {
  farmers: FarmerLocation[];      // Array of farmer locations to display
  onFarmerClick?: (farmer: FarmerLocation) => void; // Optional click handler
  center?: { lat: number; lng: number }; // Optional map center
  zoom?: number;                  // Optional zoom level
}
```

**Usage:**
- Configuring map component
- Handling farmer selection on map
- Map initialization

### LocationPickerProps Interface
**Location:** `app/dashboard/user/order-summary/LocationPicker.tsx`

```typescript
interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}
```

**Usage:**
- Delivery address selection
- Location input component
- Address geocoding

---

## 7. Analytics Interfaces

### SalesData Interface
**Location:** `app/dashboard/farmer/analytics/page.tsx`

```typescript
interface SalesData {
  date: string;            // Date in ISO format
  sales: number;           // Total sales amount for the date
  orders: number;          // Number of orders on the date
  products: number;        // Number of products sold
}
```

**Usage:**
- Farmer sales analytics dashboard
- Revenue tracking
- Performance metrics visualization

### PricingAnalytics Interface
**Location:** `app/dashboard/farmer/pricing/page.tsx`

```typescript
interface PricingAnalytics {
  productName: string;           // Name of the product
  currentPrice: number;          // Current selling price
  marketAverage: number;         // Market average price
  priceHistory: Array<{          // Historical price data
    date: string;
    price: number;
  }>;
  recommendation: 'increase' | 'decrease' | 'maintain'; // Pricing recommendation
  competitorPrices: Array<{      // Competitor pricing data
    farmerName: string;
    price: number;
  }>;
}
```

**Usage:**
- Dynamic pricing suggestions
- Market analysis
- Competitive pricing insights

### MarketPrice Interface
**Location:** `app/dashboard/farmer/pricing/page.tsx`

```typescript
interface MarketPrice {
  commodity: string;       // Commodity name (e.g., "Rice", "Corn")
  price: number;           // Current market price
  unit: string;            // Unit of measurement (e.g., "per kg")
  location: string;        // Market location
  date: string;            // Price update date
  source: string;          // Data source (e.g., "DA-AMAS")
  trend: 'up' | 'down' | 'stable'; // Price trend indicator
}
```

**Usage:**
- Market price monitoring
- Price comparison
- Informed pricing decisions

---

## 8. Component Props Interfaces

### ProductDetailsDialogProps Interface
**Location:** `app/dashboard/user/ProductDetailsDialog.tsx`

```typescript
interface ProductDetailsDialogProps {
  product: any;                  // Product object to display
  open: boolean;                 // Whether dialog is open
  onClose: () => void;           // Close handler function
  onAddToCart?: (product: any, quantity: number) => void; // Optional add to cart handler
}
```

**Usage:**
- Product detail modal
- Adding products to cart
- Displaying farmer ratings

### Farmer Interface (Rating)
**Location:** `app/dashboard/user/rate-farmer/[farmerId]/page.tsx`

```typescript
interface Farmer {
  id: string;                    // Farmer's unique ID
  name: string;                  // Farmer's display name
  email: string;                 // Farmer's email
  rating?: number;               // Average rating (0-5)
  ratingCount?: number;          // Number of ratings received
  profilePhoto?: string;         // Profile photo URL
}
```

**Usage:**
- Displaying farmer information
- Rating and review system
- Farmer profiles

---

## Best Practices

### 1. Type Safety
- Always use these interfaces instead of `any` types
- Import interfaces from their source files when needed
- Use optional properties (`?`) for fields that may not always exist

### 2. Naming Conventions
- Interface names use PascalCase
- Property names use camelCase
- Use descriptive names that indicate the data type

### 3. Firestore Integration
- Interfaces match Firestore document structures
- `id` field represents Firestore document ID
- `createdAt` and `updatedAt` use Firestore Timestamps

### 4. Form Handling
- String types used for numeric fields in forms (price, quantity)
- Convert to numbers before saving to database
- Validate input before type conversion

### 5. Optional Fields
- Use `?` for optional properties
- Always check existence before accessing optional fields
- Provide default values when appropriate

---

## Interface Usage Examples

### Example 1: Creating a New Product
```typescript
const newProduct: NewProduct = {
  name: "Organic Tomatoes",
  description: "Fresh organic tomatoes from our farm",
  category: "Vegetables",
  price: "120",
  quantity: "50",
  harvestDate: "2025-12-01",
  images: [file1, file2]
};
```

### Example 2: Handling Orders
```typescript
const order: Order = {
  id: "order123",
  buyerId: "user456",
  buyerName: "John Doe",
  farmerId: "farmer789",
  farmerName: "Jane Farm",
  productName: "Organic Tomatoes",
  quantity: 10,
  totalPrice: 1200,
  status: "pending",
  createdAt: new Date(),
  deliveryAddress: "123 Main St, City"
};
```

### Example 3: Wallet Transaction
```typescript
const transaction: Transaction = {
  id: "txn001",
  type: "payment",
  amount: 1200,
  description: "Payment for Order #order123",
  status: "completed",
  createdAt: new Date(),
  orderId: "order123"
};
```

---

## Firestore Collection Mapping

| Interface | Firestore Collection | Document ID Field |
|-----------|---------------------|-------------------|
| User | `users` | `id` |
| Product | `products` | `id` |
| Order | `orders` | `id` |
| Transaction | `walletTransactions` | `id` |
| Wallet | `wallets` | `userId` |
| Post | `communityPosts` | `id` |
| Comment | `comments` | `id` |
| Farmer | `users` (where role="farmer") | `id` |

---

## Related Documentation

- **API Documentation:** See `API_AND_DATA_FLOW_DOCUMENTATION.md`
- **Firebase Configuration:** See `app/config/firebase.ts`
- **Security Rules:** See `firestore.rules`
- **System Architecture:** See `SYSTEM_ARCHITECTURE.md`

---

## Maintenance Notes

- All interfaces are co-located with their primary usage components
- Update this documentation when adding new interfaces
- Run TypeScript compiler to verify interface compliance: `npm run build`
- Use ESLint for type checking: interfaces must match usage

---

**Document Version:** 1.0  
**Last Updated:** December 3, 2025  
**Total Interfaces Documented:** 20+
