import { useState, useCallback, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { UserData, UseQueryResult } from '@/interfaces';
import { COLLECTIONS, USER_ROLES } from '@/constants';

/**
 * Hook to fetch all users
 */
export function useUsers(): UseQueryResult<UserData[]> {
  const [data, setData] = useState<UserData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      const users = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          role: data.role || 'user',
          phoneNumber: data.phoneNumber,
          address: data.address,
          location: data.location,
          farmName: data.farmName,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserData;
      });

      setData(users);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    data,
    loading,
    error,
    refetch: fetchUsers,
  };
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string): UseQueryResult<UserData> {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const user = {
          id: docSnap.id,
          email: data.email || '',
          name: data.name || '',
          role: data.role || 'user',
          phoneNumber: data.phoneNumber,
          address: data.address,
          location: data.location,
          farmName: data.farmName,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserData;
        setData(user);
      } else {
        setError('User not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    data,
    loading,
    error,
    refetch: fetchUser,
  };
}

/**
 * Hook to fetch all farmers (users with role 'farmer')
 */
export function useFarmers(): UseQueryResult<UserData[]> {
  const [data, setData] = useState<UserData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('role', '==', USER_ROLES.FARMER),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const farmers = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          role: data.role || 'farmer',
          phoneNumber: data.phoneNumber,
          address: data.address,
          location: data.location,
          farmName: data.farmName,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserData;
      });

      setData(farmers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch farmers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  return {
    data,
    loading,
    error,
    refetch: fetchFarmers,
  };
}

/**
 * Hook to fetch farmers with location data (for map display)
 */
export function useFarmersWithLocation(): UseQueryResult<UserData[]> {
  const [data, setData] = useState<UserData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('role', '==', USER_ROLES.FARMER)
      );
      
      const snapshot = await getDocs(q);
      const farmers = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || '',
            name: data.name || '',
            role: data.role || 'farmer',
            phoneNumber: data.phoneNumber,
            address: data.address,
            location: data.location,
            farmName: data.farmName,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as UserData;
        })
        .filter((farmer: UserData) => farmer.location); // Only include farmers with location

      setData(farmers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch farmers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  return {
    data,
    loading,
    error,
    refetch: fetchFarmers,
  };
}
