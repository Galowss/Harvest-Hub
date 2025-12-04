import { useState, useCallback, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { Cart, CartItem, UseQueryResult, UseMutationResult } from '@/interfaces';
import { COLLECTIONS } from '@/constants';

/**
 * Hook to fetch user's cart
 */
export function useCart(userId: string): UseQueryResult<Cart> {
  const [data, setData] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.CART, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cart = {
          ...docSnap.data(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Cart;
        setData(cart);
      } else {
        // Create empty cart if doesn't exist
        const emptyCart: Cart = {
          userId,
          items: [],
          totalAmount: 0,
          updatedAt: new Date(),
        };
        await setDoc(docRef, {
          ...emptyCart,
          updatedAt: Timestamp.now(),
        });
        setData(emptyCart);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cart';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    data,
    loading,
    error,
    refetch: fetchCart,
  };
}

/**
 * Hook to add item to cart
 */
export function useAddToCart(): UseMutationResult<Cart, { userId: string; item: CartItem }> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Cart | null>(null);

  const mutate = useCallback(async ({ userId, item }: { userId: string; item: CartItem }) => {
    if (!userId || userId === 'guest') {
      setError('Please sign in to add items to cart');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.CART, userId);
      const docSnap = await getDoc(docRef);

      let updatedCart: Cart;

      if (docSnap.exists()) {
        const currentCart = docSnap.data() as Cart;
        const existingItemIndex = currentCart.items.findIndex(
          (i) => i.productId === item.productId
        );

        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          currentCart.items[existingItemIndex].quantity += item.quantity;
        } else {
          // Add new item
          currentCart.items.push(item);
        }

        // Recalculate total
        currentCart.totalAmount = currentCart.items.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );
        currentCart.updatedAt = new Date();

        await updateDoc(docRef, {
          items: currentCart.items,
          totalAmount: currentCart.totalAmount,
          updatedAt: Timestamp.now(),
        });

        updatedCart = currentCart;
      } else {
        // Create new cart
        updatedCart = {
          userId,
          items: [item],
          totalAmount: item.price * item.quantity,
          updatedAt: new Date(),
        };

        await setDoc(docRef, {
          ...updatedCart,
          updatedAt: Timestamp.now(),
        });
      }

      setData(updatedCart);
      return updatedCart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
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
 * Hook to update cart item quantity
 */
export function useUpdateCartItem(): UseMutationResult<Cart, { userId: string; productId: string; quantity: number }> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Cart | null>(null);

  const mutate = useCallback(async ({ userId, productId, quantity }: { userId: string; productId: string; quantity: number }) => {
    if (!userId || userId === 'guest') {
      setError('Please sign in to update cart');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.CART, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Cart not found');
        return null;
      }

      const currentCart = docSnap.data() as Cart;
      const itemIndex = currentCart.items.findIndex((i) => i.productId === productId);

      if (itemIndex < 0) {
        setError('Item not found in cart');
        return null;
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        currentCart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        currentCart.items[itemIndex].quantity = quantity;
      }

      // Recalculate total
      currentCart.totalAmount = currentCart.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      currentCart.updatedAt = new Date();

      await updateDoc(docRef, {
        items: currentCart.items,
        totalAmount: currentCart.totalAmount,
        updatedAt: Timestamp.now(),
      });

      setData(currentCart);
      return currentCart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart';
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
 * Hook to remove item from cart
 */
export function useRemoveFromCart(): UseMutationResult<Cart, { userId: string; productId: string }> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Cart | null>(null);

  const mutate = useCallback(async ({ userId, productId }: { userId: string; productId: string }) => {
    if (!userId || userId === 'guest') {
      setError('Please sign in to modify cart');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.CART, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Cart not found');
        return null;
      }

      const currentCart = docSnap.data() as Cart;
      currentCart.items = currentCart.items.filter((i) => i.productId !== productId);
      
      // Recalculate total
      currentCart.totalAmount = currentCart.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      currentCart.updatedAt = new Date();

      await updateDoc(docRef, {
        items: currentCart.items,
        totalAmount: currentCart.totalAmount,
        updatedAt: Timestamp.now(),
      });

      setData(currentCart);
      return currentCart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
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
 * Hook to clear cart
 */
export function useClearCart(): UseMutationResult<Cart, string> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Cart | null>(null);

  const mutate = useCallback(async (userId: string) => {
    if (!userId || userId === 'guest') {
      setError('Please sign in to clear cart');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.CART, userId);
      
      const emptyCart: Cart = {
        userId,
        items: [],
        totalAmount: 0,
        updatedAt: new Date(),
      };

      await updateDoc(docRef, {
        items: [],
        totalAmount: 0,
        updatedAt: Timestamp.now(),
      });

      setData(emptyCart);
      return emptyCart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
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
