// Example: How to integrate caching in your existing Firebase queries
// This is a reference implementation showing the pattern to follow

import { CacheService } from '@/lib/cacheService';
import { db } from '@/app/config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// ==========================================
// PATTERN 1: Caching a simple collection query
// ==========================================

export async function getProductsWithCache() {
  const cacheKey = CacheService.productsListKey();
  
  // Try cache first
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    console.log('✅ Products loaded from cache');
    return cached;
  }

  // Cache miss - fetch from Firestore
  console.log('⚠️ Cache miss - fetching from Firestore');
  const querySnapshot = await getDocs(collection(db, "products"));
  const products = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Store in cache (1 hour TTL)
  await CacheService.set(cacheKey, products, 3600);
  
  return products;
}

// ==========================================
// PATTERN 2: Caching filtered queries
// ==========================================

export async function getFarmerProductsWithCache(farmerId: string) {
  const cacheKey = CacheService.farmerProductsKey(farmerId);
  
  // Try cache first
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from Firestore
  const q = query(collection(db, "products"), where("farmerId", "==", farmerId));
  const querySnapshot = await getDocs(q);
  const products = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Cache for 30 minutes
  await CacheService.set(cacheKey, products, 1800);
  
  return products;
}

// ==========================================
// PATTERN 3: Cache invalidation after updates
// ==========================================

export async function updateProductAndInvalidateCache(productId: string, farmerId: string, updates: any) {
  // Update in Firestore (your existing code)
  // await updateDoc(doc(db, "products", productId), updates);

  // Invalidate related caches
  await CacheService.del(CacheService.productKey(productId));
  await CacheService.del(CacheService.farmerProductsKey(farmerId));
  await CacheService.invalidatePattern('products:list:*');

  console.log('✅ Cache invalidated after product update');
}

// ==========================================
// PATTERN 4: Session caching for user data
// ==========================================

export async function getUserWithCache(userId: string) {
  const cacheKey = CacheService.userKey(userId);
  
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch user data from Firestore
  // const userDoc = await getDoc(doc(db, "users", userId));
  // const userData = userDoc.data();

  // Cache user session for 15 minutes
  // await CacheService.set(cacheKey, userData, 900);
  
  // return userData;
}

// ==========================================
// HOW TO APPLY TO YOUR EXISTING CODE:
// ==========================================

/*
1. In app/dashboard/user/page.tsx (line 65):
   BEFORE:
   const querySnapshot = await getDocs(collection(db, "products"));

   AFTER:
   const products = await getProductsWithCache();

2. In app/dashboard/farmer/orders/page.tsx (line 46):
   BEFORE:
   const q = query(collection(db, "orders"), where("farmerId", "==", farmerId));
   const querySnapshot = await getDocs(q);

   AFTER:
   const cacheKey = CacheService.farmerOrdersKey(farmerId);
   const cached = await CacheService.get(cacheKey);
   if (cached) {
     setOrders(cached);
   } else {
     const q = query(collection(db, "orders"), where("farmerId", "==", farmerId));
     const querySnapshot = await getDocs(q);
     const ordersData = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
     await CacheService.set(cacheKey, ordersData, 300); // 5 min cache
     setOrders(ordersData);
   }

3. After creating/updating orders (app/dashboard/user/order-summary/page.tsx):
   After line 136 (await addDoc(collection(db, "orders"), orderData);):
   
   // Invalidate user and farmer order caches
   await CacheService.del(CacheService.ordersKey(userId));
   await CacheService.del(CacheService.farmerOrdersKey(farmerId));
   
   // Publish event to RabbitMQ
   await EventPublisher.publishOrderCreated(orderData);
*/
