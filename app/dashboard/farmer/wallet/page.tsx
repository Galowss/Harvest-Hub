"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "withdrawal" | "refund";
  amount: number;
  description: string;
  orderId?: string;
  createdAt: any;
  status: "pending" | "completed" | "failed";
}

interface WalletData {
  balance: number;
  totalEarnings: number;
  pendingAmount: number;
  withdrawalHistory: number;
}

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<WalletData>({
    balance: 0,
    totalEarnings: 0,
    pendingAmount: 0,
    withdrawalHistory: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().role === "farmer") {
        setUser({ id: currentUser.uid, ...docSnap.data() });
        await fetchWalletData(currentUser.uid);
      } else {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchWalletData = async (farmerId: string) => {
    try {
      // Fetch completed orders for this farmer
      const ordersQuery = query(
        collection(db, "orders"),
        where("farmerId", "==", farmerId),
        where("status", "==", "completed")
      );
      const ordersSnapshot = await getDocs(ordersQuery);

      let totalEarnings = 0;
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        const amount = (parseFloat(orderData.price) || 0) * (parseInt(orderData.quantity) || 1);
        totalEarnings += amount;
      });

      // Fetch pending orders
      const pendingQuery = query(
        collection(db, "orders"),
        where("farmerId", "==", farmerId),
        where("status", "in", ["pending", "out-for-delivery"])
      );
      const pendingSnapshot = await getDocs(pendingQuery);

      let pendingAmount = 0;
      pendingSnapshot.forEach((doc) => {
        const orderData = doc.data();
        const amount = (parseFloat(orderData.price) || 0) * (parseInt(orderData.quantity) || 1);
        pendingAmount += amount;
      });

      // Fetch wallet transactions
      const walletRef = doc(db, "wallets", farmerId);
      const walletSnap = await getDoc(walletRef);

      let currentBalance = totalEarnings;
      let withdrawalHistory = 0;

      if (walletSnap.exists()) {
        const walletData = walletSnap.data();
        currentBalance = walletData.balance || 0;
        withdrawalHistory = walletData.totalWithdrawals || 0;
      } else {
        // Create wallet document if it doesn't exist
        await updateDoc(walletRef, {
          balance: totalEarnings,
          totalEarnings,
          totalWithdrawals: 0,
          lastUpdated: new Date(),
        }).catch(async () => {
          // If update fails (doc doesn't exist), create it
          await addDoc(collection(db, "wallets"), {
            farmerId,
            balance: totalEarnings,
            totalEarnings,
            totalWithdrawals: 0,
            lastUpdated: new Date(),
          });
        });
      }

      setWallet({
        balance: currentBalance,
        totalEarnings,
        pendingAmount,
        withdrawalHistory,
      });

      // Fetch transaction history
      const txQuery = query(
        collection(db, "transactions"),
        where("userId", "==", farmerId),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const txSnapshot = await getDocs(txQuery);

      const txData: Transaction[] = txSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Transaction));

      setTransactions(txData);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    }
  };

  const handleWithdrawal = async () => {
    if (!user) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > wallet.balance) {
      alert("Insufficient balance");
      return;
    }

    setProcessingWithdrawal(true);

    try {
      // Create withdrawal transaction
      await addDoc(collection(db, "transactions"), {
        userId: user.id,
        type: "withdrawal",
        amount: amount,
        description: `Withdrawal to bank account`,
        status: "completed",
        createdAt: new Date(),
      });

      // Update wallet balance
      const walletRef = doc(db, "wallets", user.id);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        const currentData = walletSnap.data();
        await updateDoc(walletRef, {
          balance: (currentData.balance || 0) - amount,
          totalWithdrawals: (currentData.totalWithdrawals || 0) + amount,
          lastUpdated: new Date(),
        });
      }

      alert(`Successfully withdrawn ₱${amount.toFixed(2)}. Funds will be transferred to your bank account within 1-3 business days.`);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      await fetchWalletData(user.id);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("Failed to process withdrawal. Please try again.");
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a href="/dashboard/farmer" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Dashboard
          </a>
          <a href="/dashboard/farmer/profile" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Profile
          </a>
          <a href="/dashboard/farmer/orders" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/farmer/pricing" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Market Pricing
          </a>
          <a href="/dashboard/farmer/wallet" className="block px-3 py-2 rounded bg-green-100 text-green-800 whitespace-nowrap text-sm lg:text-base">
            Digital Wallet
          </a>
          <a href="/dashboard/farmer/ratings" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Ratings
          </a>
        </nav>

        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">💰 Digital Wallet</h1>
          <p className="text-gray-600">Manage your earnings and payouts</p>
        </header>

        {/* Wallet Summary */}
        <section className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm opacity-90 mb-1">Available Balance</p>
              <p className="text-3xl font-bold">₱{wallet.balance.toFixed(2)}</p>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="mt-3 px-4 py-2 bg-white text-green-600 rounded font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Withdraw Funds
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-blue-600">₱{wallet.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">All-time earnings</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Pending Amount</p>
              <p className="text-3xl font-bold text-orange-600">₱{wallet.pendingAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">From pending orders</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Total Withdrawals</p>
              <p className="text-3xl font-bold text-purple-600">₱{wallet.withdrawalHistory.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">Lifetime withdrawals</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Withdraw Funds</p>
                  <p className="text-xs text-gray-600">Transfer to bank account</p>
                </div>
              </div>
            </button>

            <a
              href="/dashboard/farmer/orders"
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">View Orders</p>
                  <p className="text-xs text-gray-600">Check pending payouts</p>
                </div>
              </div>
            </a>

            <button
              onClick={() => fetchWalletData(user.id)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Refresh Balance</p>
                  <p className="text-xs text-gray-600">Update wallet data</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Transaction History */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Transaction History</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                      <th className="px-4 py-3 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">
                          {tx.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            tx.type === "credit" ? "bg-green-100 text-green-800" :
                            tx.type === "withdrawal" ? "bg-purple-100 text-purple-800" :
                            tx.type === "refund" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {tx.type === "credit" && "💰 Payment"}
                            {tx.type === "withdrawal" && "🏦 Withdrawal"}
                            {tx.type === "refund" && "↩️ Refund"}
                            {tx.type === "debit" && "📤 Debit"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{tx.description}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${
                          tx.type === "credit" || tx.type === "refund" ? "text-green-600" : "text-red-600"
                        }`}>
                          {tx.type === "credit" || tx.type === "refund" ? "+" : "-"}₱{tx.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            tx.status === "completed" ? "bg-green-100 text-green-800" :
                            tx.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                          }`}>
                            {tx.status === "completed" && "✓"}
                            {tx.status === "pending" && "⏳"}
                            {tx.status === "failed" && "✗"}
                            {" "}{tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">₱{wallet.balance.toFixed(2)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                max={wallet.balance}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>Withdrawal Options:</strong> GCash or PayPal only
              </p>
              <p className="text-xs text-blue-700 mt-1">
                💳 GCash: Instant to 24 hours<br/>
                🌐 PayPal: 1-3 business days<br/>
                Enter your GCash number (09XXXXXXXXX) or PayPal email below
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={processingWithdrawal || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingWithdrawal ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
