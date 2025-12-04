// API Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Firebase collections
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CART: 'cart',
  REVIEWS: 'reviews',
  RATINGS: 'ratings',
  COMMUNITY_POSTS: 'community_posts',
  COMMUNITY_COMMENTS: 'community_comments',
  WALLETS: 'wallets',
  WALLET_TRANSACTIONS: 'wallet_transactions',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  FARMER: 'farmer',
  USER: 'user',
  GUEST: 'guest',
} as const;

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out-for-delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Product categories
export const PRODUCT_CATEGORIES = {
  VEGETABLES: 'Vegetables',
  FRUITS: 'Fruits',
  GRAINS: 'Grains',
  HERBS: 'Herbs',
  DAIRY: 'Dairy',
  MEAT: 'Meat',
  OTHER: 'Other',
} as const;

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  USERS: 'users',
  ORDERS: 'orders',
} as const;

// Request timeouts (in milliseconds)
export const REQUEST_TIMEOUT = 30000;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
