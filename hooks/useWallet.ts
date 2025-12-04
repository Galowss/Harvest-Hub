import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { Wallet, WalletTransaction, UseQueryResult, UseMutationResult } from '@/interfaces';
import { COLLECTIONS } from '@/constants';

/**
 * Hook to fetch user's wallet
 */
export function useWallet(userId: string): UseQueryResult<Wallet> {
  const [data, setData] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, COLLECTIONS.WALLETS, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const wallet = {
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Wallet;
        setData(wallet);
      } else {
        // Create wallet if doesn't exist
        const newWallet: Wallet = {
          userId,
          balance: 0,
          currency: 'PHP',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(docRef, {
          ...newWallet,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        setData(newWallet);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return {
    data,
    loading,
    error,
    refetch: fetchWallet,
  };
}

/**
 * Hook to add funds to wallet
 */
export function useAddFunds(): UseMutationResult<Wallet, { userId: string; amount: number; description: string }> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Wallet | null>(null);

  const mutate = useCallback(async ({ userId, amount, description }: { userId: string; amount: number; description: string }) => {
    if (!userId || userId === 'guest') {
      setError('Please sign in to add funds');
      return null;
    }

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const walletRef = doc(db, COLLECTIONS.WALLETS, userId);
      const walletSnap = await getDoc(walletRef);

      let currentBalance = 0;
      if (walletSnap.exists()) {
        currentBalance = walletSnap.data().balance || 0;
      }

      const newBalance = currentBalance + amount;

      // Update wallet
      await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      // Create transaction record (optional - you might want a separate collection)
      // For now, just return updated wallet

      const updatedWallet: Wallet = {
        userId,
        balance: newBalance,
        currency: 'PHP',
        createdAt: walletSnap.data()?.createdAt?.toDate() || new Date(),
        updatedAt: new Date(),
      };

      setData(updatedWallet);
      return updatedWallet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add funds';
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
 * Hook to deduct funds from wallet
 */
export function useDeductFunds(): UseMutationResult<Wallet, { userId: string; amount: number; description: string }> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Wallet | null>(null);

  const mutate = useCallback(async ({ userId, amount, description }: { userId: string; amount: number; description: string }) => {
    if (!userId || userId === 'guest') {
      setError('Please sign in to use wallet');
      return null;
    }

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const walletRef = doc(db, COLLECTIONS.WALLETS, userId);
      const walletSnap = await getDoc(walletRef);

      if (!walletSnap.exists()) {
        setError('Wallet not found');
        return null;
      }

      const currentBalance = walletSnap.data().balance || 0;

      if (currentBalance < amount) {
        setError('Insufficient funds');
        return null;
      }

      const newBalance = currentBalance - amount;

      // Update wallet
      await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      const updatedWallet: Wallet = {
        userId,
        balance: newBalance,
        currency: 'PHP',
        createdAt: walletSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: new Date(),
      };

      setData(updatedWallet);
      return updatedWallet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deduct funds';
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
