import { useCallback, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/app/config/firebase';
import { LoginCredentials, RegisterData, UserData } from '@/interfaces';
import { COLLECTIONS } from '@/constants';

/**
 * Hook for user login with Firebase Authentication
 */
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserData | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = {
          id: userDoc.id,
          ...userDoc.data(),
        } as UserData;
        
        setData(userData);
        setLoading(false);
        return { success: true, data: userData };
      } else {
        throw new Error('User profile not found');
      }
    } catch (err: unknown) {
      let errorMessage = 'Login failed';
      
      if (err instanceof Error) {
        // Handle Firebase auth errors
        if (err.message.includes('user-not-found') || err.message.includes('wrong-password')) {
          errorMessage = 'Invalid email or password';
        } else if (err.message.includes('too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    login,
    loading,
    error,
    data,
    reset,
  };
}

/**
 * Hook for user registration with Firebase Authentication
 */
export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserData | null>(null);

  const register = useCallback(async (registerData: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );

      // Create user profile in Firestore
      const userData: UserData = {
        id: userCredential.user.uid,
        email: registerData.email,
        name: registerData.name,
        role: registerData.role,
        phoneNumber: registerData.phoneNumber,
        address: registerData.address,
        farmName: registerData.farmName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid), userData);

      setData(userData);
      setLoading(false);
      return { success: true, data: userData };
    } catch (err: unknown) {
      let errorMessage = 'Registration failed';
      
      if (err instanceof Error) {
        // Handle Firebase auth errors
        if (err.message.includes('email-already-in-use')) {
          errorMessage = 'Email already registered';
        } else if (err.message.includes('weak-password')) {
          errorMessage = 'Password should be at least 6 characters';
        } else if (err.message.includes('invalid-email')) {
          errorMessage = 'Invalid email address';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    register,
    loading,
    error,
    data,
    reset,
  };
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await signOut(auth);
      setLoading(false);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    logout,
    loading,
    error,
    reset,
  };
}
