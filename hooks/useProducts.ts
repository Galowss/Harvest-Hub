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
import { Product, CreateProductData, UpdateProductData, UseQueryResult, UseMutationResult } from '@/interfaces';
import { COLLECTIONS } from '@/constants';

/**
 * Hook to fetch all products
 */
export function useProducts(): UseQueryResult<Product[]> {
  const [data, setData] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('isArchived', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];

      setData(products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    data,
    loading,
    error,
    refetch: fetchProducts,
  };
}

/**
 * Hook to fetch products by farmer
 */
export function useProductsByFarmer(farmerId: string): UseQueryResult<Product[]> {
  const [data, setData] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!farmerId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('farmerId', '==', farmerId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];

      setData(products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    data,
    loading,
    error,
    refetch: fetchProducts,
  };
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(productId: string): UseQueryResult<Product> {
  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const product = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Product;
        setData(product);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    data,
    loading,
    error,
    refetch: fetchProduct,
  };
}

/**
 * Hook to create a new product
 */
export function useCreateProduct(): UseMutationResult<Product, CreateProductData> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Product | null>(null);

  const mutate = useCallback(async (productData: CreateProductData) => {
    setLoading(true);
    setError(null);

    try {
      const newProduct = {
        ...productData,
        isArchived: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), newProduct);
      
      const product = {
        id: docRef.id,
        ...productData,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      setData(product);
      return product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
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
 * Hook to update a product
 */
export function useUpdateProduct(): UseMutationResult<Product, UpdateProductData> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Product | null>(null);

  const mutate = useCallback(async (productData: UpdateProductData) => {
    if (!productData.id) {
      setError('Product ID is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { id, ...updateData } = productData;
      const docRef = doc(db, COLLECTIONS.PRODUCTS, id);

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const product = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Product;
        
        setData(product);
        return product;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
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
 * Hook to archive/unarchive a product
 */
export function useArchiveProduct(): UseMutationResult<Product, { id: string; isArchived: boolean }> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Product | null>(null);

  const mutate = useCallback(async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
      
      await updateDoc(docRef, {
        isArchived,
        updatedAt: Timestamp.now(),
      });

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const product = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Product;
        
        setData(product);
        return product;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive product';
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
