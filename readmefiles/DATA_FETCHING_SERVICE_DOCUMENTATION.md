# Data Fetching Service & Hooks Architecture

This project implements a comprehensive data fetching service with custom React hooks for Activity #5.

## 📁 Directory Structure

```
/services/
  ├── RequestService.ts        # Base HTTP service handler with authentication
/hooks/
  ├── useAuthRequest.ts        # Base hooks for authenticated/unauthenticated requests
  ├── useAuth.ts               # Authentication hooks (login, register, logout)
  ├── useProducts.ts           # Product CRUD operations
  ├── useOrders.ts             # Order management
  ├── useCart.ts               # Shopping cart operations
  ├── useCommunity.ts          # Community posts and comments
  ├── useWallet.ts             # Digital wallet operations
  └── useUsers.ts              # User data fetching
/interfaces/
  └── index.ts                 # TypeScript type definitions
/constants/
  └── index.ts                 # API endpoints and configuration
```

## 🔧 Core Components

### 1. RequestService (`services/RequestService.ts`)

Base HTTPS service handler that provides:
- **Authentication**: Automatic Firebase JWT token injection
- **Error Handling**: Comprehensive error catching and user-friendly messages
- **Timeout Management**: Configurable request timeouts (default: 30s)
- **Request Methods**: GET, POST, PUT, PATCH, DELETE

**Example Usage:**
```typescript
import { requestService } from '@/services/RequestService';

const response = await requestService.get('/api/products', { requiresAuth: true });
```

### 2. Base Request Hooks (`hooks/useAuthRequest.ts`)

Two foundational hooks:
- **`useAuthRequest<T, V>()`**: For authenticated requests
- **`useRequest<T, V>()`**: For public/unauthenticated requests

Both provide:
- `execute()` - Execute the request
- `loading` - Loading state
- `error` - Error messages
- `data` - Response data
- `reset()` - Reset hook state

### 3. Authentication Hooks (`hooks/useAuth.ts`)

#### **useLogin()**
```typescript
const { login, loading, error, data } = useLogin();

const result = await login({ email, password });
if (result.success) {
  // User logged in successfully
}
```

#### **useRegister()**
```typescript
const { register, loading, error, data } = useRegister();

const result = await register({
  email,
  password,
  name,
  role: 'user' | 'farmer',
  phoneNumber,
  address,
});
```

#### **useLogout()**
```typescript
const { logout, loading, error } = useLogout();

await logout();
```

### 4. Product Hooks (`hooks/useProducts.ts`)

- **`useProducts()`** - Fetch all active products
- **`useProductsByFarmer(farmerId)`** - Fetch products by specific farmer
- **`useProduct(productId)`** - Fetch single product details
- **`useCreateProduct()`** - Create new product
- **`useUpdateProduct()`** - Update existing product
- **`useArchiveProduct()`** - Archive/unarchive product

**Example:**
```typescript
const { data: products, loading, error, refetch } = useProducts();

// Create product
const { mutate: createProduct } = useCreateProduct();
await createProduct({
  name: 'Tomatoes',
  price: 50,
  stock: 100,
  category: 'Vegetables',
  // ...
});
```

### 5. Order Hooks (`hooks/useOrders.ts`)

- **`useOrdersByUser(userId)`** - Fetch user's orders
- **`useOrdersByFarmer(farmerId)`** - Fetch orders containing farmer's products
- **`useOrder(orderId)`** - Fetch single order
- **`useCreateOrder()`** - Create new order
- **`useUpdateOrderStatus()`** - Update order status

**Example:**
```typescript
const { data: orders, loading, error } = useOrdersByUser(userId);

// Create order
const { mutate: createOrder } = useCreateOrder();
await createOrder({
  userId,
  userName,
  items: cartItems,
  totalAmount,
  deliveryAddress,
  deliveryMethod: 'delivery',
  phoneNumber,
});
```

### 6. Cart Hooks (`hooks/useCart.ts`)

- **`useCart(userId)`** - Fetch user's cart
- **`useAddToCart()`** - Add item to cart
- **`useUpdateCartItem()`** - Update item quantity
- **`useRemoveFromCart()`** - Remove item from cart
- **`useClearCart()`** - Clear entire cart

**Example:**
```typescript
const { data: cart, loading, error, refetch } = useCart(userId);

const { mutate: addToCart } = useAddToCart();
await addToCart({
  userId,
  item: {
    productId,
    productName,
    quantity: 1,
    price,
    unit,
    farmerId,
  },
});
```

### 7. Community Hooks (`hooks/useCommunity.ts`)

- **`useCommunityPosts()`** - Fetch all community posts
- **`usePostComments(postId)`** - Fetch comments for a post
- **`useCreatePost()`** - Create new post
- **`useLikePost()`** - Like/unlike a post
- **`useAddComment()`** - Add comment to post

**Example:**
```typescript
const { data: posts, loading, error, refetch } = useCommunityPosts();

const { mutate: createPost } = useCreatePost();
await createPost({
  userId,
  userName,
  content: 'Check out my fresh produce!',
  imageUrl,
});
```

### 8. Wallet Hooks (`hooks/useWallet.ts`)

- **`useWallet(userId)`** - Fetch wallet balance
- **`useAddFunds()`** - Add funds to wallet
- **`useDeductFunds()`** - Deduct funds from wallet

**Example:**
```typescript
const { data: wallet, loading, error, refetch } = useWallet(userId);

const { mutate: addFunds } = useAddFunds();
await addFunds({
  userId,
  amount: 500,
  description: 'GCash top-up',
});
```

### 9. User Hooks (`hooks/useUsers.ts`)

- **`useUsers()`** - Fetch all users
- **`useUser(userId)`** - Fetch single user
- **`useFarmers()`** - Fetch all farmers
- **`useFarmersWithLocation()`** - Fetch farmers with map coordinates

**Example:**
```typescript
const { data: farmers, loading, error } = useFarmersWithLocation();

// Display farmers on map
farmers?.forEach(farmer => {
  if (farmer.location) {
    // Add marker at farmer.location.latitude, farmer.location.longitude
  }
});
```

## 📦 TypeScript Interfaces

All hooks are fully typed with TypeScript interfaces defined in `interfaces/index.ts`:

- `RequestOptions` - HTTP request configuration
- `ApiResponse<T>` - Standardized API responses
- `UserData` - User profile structure
- `Product` - Product details
- `Order` - Order information
- `Cart` - Shopping cart
- `CommunityPost` - Community post
- `Wallet` - Digital wallet
- `UseQueryResult<T>` - Query hook return type
- `UseMutationResult<T, V>` - Mutation hook return type

## 🔐 Authentication & Security

- All authenticated requests automatically include Firebase JWT token
- Token is retrieved via `auth.currentUser.getIdToken()`
- Tokens are injected in `Authorization: Bearer <token>` header
- Guest users (`role: 'guest'`) are blocked from write operations

## 🎯 Error Handling

Every hook provides error handling:
```typescript
const { data, loading, error } = useProducts();

if (error) {
  // Display error message
  console.error('Failed to load products:', error);
}
```

Common error scenarios handled:
- Network failures
- Authentication errors
- Permission denied
- Invalid data
- Firestore errors
- Timeout errors

## 🔄 Data Refetching

Query hooks provide a `refetch()` function:
```typescript
const { data, refetch } = useProducts();

// Manually refresh data
await refetch();
```

## 📊 Loading States

All hooks provide loading indicators:
```typescript
const { loading } = useProducts();

if (loading) {
  return <Spinner />;
}
```

## 🚀 Usage Example in Components

```typescript
'use client';
import { useProducts, useAddToCart } from '@/hooks';
import { useEffect } from 'react';

export default function ProductList({ userId }) {
  const { data: products, loading, error } = useProducts();
  const { mutate: addToCart, loading: addingToCart } = useAddToCart();

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleAddToCart = async (product) => {
    const result = await addToCart({
      userId,
      item: {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        unit: product.unit,
        farmerId: product.farmerId,
        imageUrl: product.imageUrl,
      },
    });

    if (result) {
      alert('Added to cart!');
    }
  };

  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>₱{product.price}/{product.unit}</p>
          <button 
            onClick={() => handleAddToCart(product)}
            disabled={addingToCart}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 🛠️ Configuration

Constants are defined in `constants/index.ts`:
- `API_BASE_URL` - API endpoint base URL
- `COLLECTIONS` - Firestore collection names
- `USER_ROLES` - User role constants
- `ORDER_STATUS` - Order status values
- `PRODUCT_CATEGORIES` - Product categories
- `REQUEST_TIMEOUT` - HTTP timeout (30s)

## ✅ Implementation Complete

All Activity #5 requirements fulfilled:
- ✅ HTTPS service handler with authentication
- ✅ Custom hooks for each module/endpoint
- ✅ File structure: `/services/`, `/hooks/`, `/interfaces/`, `/constants/`
- ✅ Authentication and request error handling
- ✅ Custom hooks for login, register, and all CRUD operations

## 🔗 Integration with Existing System

These hooks integrate seamlessly with the existing Harvest Hub system:
- Uses Firebase Authentication (already configured)
- Reads from Firestore collections (users, products, orders, etc.)
- Compatible with guest browsing mode
- Works with existing cache service
- Supports event-driven architecture

## 📝 Next Steps

To use these hooks in existing pages:
1. Replace direct Firestore calls with hooks
2. Remove duplicate state management
3. Leverage loading states for better UX
4. Use error states for user feedback
5. Implement optimistic updates where appropriate
