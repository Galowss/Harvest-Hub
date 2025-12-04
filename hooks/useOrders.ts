import { useState, useCallback, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { Order, CreateOrderData, UseQueryResult, UseMutationResult } from '@/interfaces';
import { COLLECTIONS, ORDER_STATUS } from '@/constants';

/**
 * Hook to fetch orders by user
 */
export function useOrdersByUser(userId: string): UseQueryResult<Order[]> {
  const [data, setData] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Order[];

      setData(orders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    data,
    loading,
    error,
    refetch: fetchOrders,
  };
}

/**
 * Hook to fetch orders for a farmer
 */
export function useOrdersByFarmer(farmerId: string): UseQueryResult<Order[]> {
  const [data, setData] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!farmerId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ordersSnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
      
      // Filter orders that contain products from this farmer
      const farmerOrders = ordersSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }))
        .filter((order: Order) => 
          order.items.some((item) => item.farmerId === farmerId)
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Order[];

      setData(farmerOrders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    data,
    loading,
    error,
    refetch: fetchOrders,
  };
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(orderId: string): UseQueryResult<Order> {
  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const order = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Order;
        setData(order);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    data,
    loading,
    error,
    refetch: fetchOrder,
  };
}

/**
 * Hook to create a new order
 */
export function useCreateOrder(): UseMutationResult<Order, CreateOrderData> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Order | null>(null);

  const mutate = useCallback(async (orderData: CreateOrderData) => {
    setLoading(true);
    setError(null);

    try {
      const newOrder = {
        ...orderData,
        status: ORDER_STATUS.PENDING,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), newOrder);
      
      const order = {
        id: docRef.id,
        ...orderData,
        status: ORDER_STATUS.PENDING as 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Order;

      setData(order);
      return order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
  };
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus(): UseMutationResult<Order, { orderId: string; status: string }> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Order | null>(null);

  const mutate = useCallback(async ({ orderId, status }: { orderId: string; status: string }) => {
    if (!orderId) {
      setError('Order ID is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
      
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      });

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const order = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Order;
        
        setData(order);
        return order;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
  };
}
