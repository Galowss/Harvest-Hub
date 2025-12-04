import { User } from 'firebase/auth';

// Request/Response interfaces
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  requiresAuth?: boolean;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User interfaces
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'farmer' | 'user' | 'guest';
  phoneNumber?: string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  farmName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'farmer' | 'user';
  phoneNumber?: string;
  address?: string;
  farmName?: string;
}

// Product interfaces
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  stock: number;
  farmerId: string;
  farmerName: string;
  imageUrl?: string;
  isArchived?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  stock: number;
  farmerId: string;
  farmerName: string;
  imageUrl?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
  isArchived?: boolean;
}

// Order interfaces
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  farmerId: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'completed' | 'cancelled';
  deliveryAddress: string;
  deliveryMethod: 'delivery' | 'pickup';
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryTime?: string;
}

export interface CreateOrderData {
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryMethod: 'delivery' | 'pickup';
  phoneNumber: string;
  deliveryTime?: string;
}

// Cart interfaces
export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  farmerId: string;
  imageUrl?: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalAmount: number;
  updatedAt: Date;
}

// Community interfaces
export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  content: string;
  imageUrl?: string;
  likes: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

// Wallet interfaces
export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  orderId?: string;
  createdAt: Date;
}

// Hook return types
export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  data: T | null;
}
