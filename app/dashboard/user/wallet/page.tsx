"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/config/firebase";
import { doc, getDoc, setDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";

interface Transaction {
  id: string;
  type: 'topup' | 'payment' | 'refund';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: any;
  orderId?: string;
}

interface Wallet {
  balance: number;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser({ id: currentUser.uid, email: currentUser.email });
      await loadWalletData(currentUser.uid);
    });
    return () => unsubscribe();
  }, [router]);

  const loadWalletData = async (userId: string) => {
    try {
      // Get or create wallet
      const walletRef = doc(db, "wallets", userId);
      const walletSnap = await getDoc(walletRef);
      
      if (!walletSnap.exists()) {
        // Create new wallet
        const newWallet = {
          balance: 0,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(walletRef, newWallet);
        setWallet(newWallet);
      } else {
        setWallet({ id: walletSnap.id, ...walletSnap.data() } as any);
      }

      // Get transactions
      const transactionsQuery = query(
        collection(db, "wallet_transactions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      const transactionsList = transactionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(transactionsList);
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (amount < 100) {
      alert("Minimum top-up amount is ₱100");
      return;
    }

    setProcessing(true);
    try {
      // Create transaction record
      await addDoc(collection(db, "wallet_transactions"), {
        userId: user.id,
        type: 'topup',
        amount,
        description: `Wallet top-up via HarvestHub Pay`,
        status: 'completed',
        createdAt: new Date()
      });

      // Update wallet balance
      const walletRef = doc(db, "wallets", user.id);
      await updateDoc(walletRef, {
        balance: increment(amount),
        updatedAt: new Date()
      });

      alert(`Successfully added ₱${amount.toFixed(2)} to your wallet!`);
      setTopupAmount('');
      setShowTopup(false);
      await loadWalletData(user.id);
    } catch (error) {
      console.error("Error topping up:", error);
      alert("Error processing top-up. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return '💰';
      case 'payment':
        return '🛒';
      case 'refund':
        return '↩️';
      default:
        return '📝';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'topup':
      case 'refund':
        return 'text-green-600';
      case 'payment':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm shadow-xl border-r border-purple-100 p-3 sm:p-4 lg:h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <img src="/harvest-hub-logo.png" alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block space-y-2`}>
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Home
          </a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Cart
          </a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/user/wallet" className="block px-3 py-2 rounded bg-purple-100 text-purple-800 text-sm lg:text-base">
            Wallet
          </a>
          <a href="/dashboard/user/rate_farmer" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Rate Farmer
          </a>
          <a href="/dashboard/user/profile" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Profile
          </a>
          <a href="/dashboard/community" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Community Hub
          </a>
          <a href="/dashboard/map" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Farmer Map
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              HarvestHub Wallet
            </h1>
            <p className="text-gray-600 mt-2">Manage your wallet balance and transactions</p>
          </div>

          {/* Wallet Card */}
          <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-6 sm:p-8 mb-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-purple-100 text-sm mb-1">Available Balance</p>
                <h2 className="text-3xl sm:text-4xl font-bold">₱{wallet?.balance.toFixed(2) || '0.00'}</h2>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTopup(true)}
                className="flex-1 bg-white text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                + Top Up
              </button>
              <button
                onClick={() => router.push('/dashboard/user/orders')}
                className="flex-1 bg-white/20 backdrop-blur-sm text-white py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                Pay Orders
              </button>
            </div>
          </div>

          {/* Top-up Modal */}
          {showTopup && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Top Up Wallet</h3>
                  <button
                    onClick={() => setShowTopup(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (Minimum ₱100)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
                    <input
                      type="number"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                      min="100"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopupAmount(amount.toString())}
                      className="py-2 px-4 border border-purple-300 rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-colors text-sm font-medium"
                    >
                      ₱{amount}
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs text-gray-700">
                      <p className="font-semibold text-blue-900 mb-1">Mock Payment System</p>
                      <p>This is a demo e-wallet. Funds are added instantly for testing purposes only.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTopup(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTopup}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Confirm Top Up'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Transaction History</h3>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-1">Your wallet transactions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center text-2xl">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.createdAt?.toDate?.().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'payment' ? '-' : '+'}₱{transaction.amount.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
