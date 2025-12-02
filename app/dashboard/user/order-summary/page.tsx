"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { db, auth } from "@/app/config/firebase";
import { addDoc, collection, doc, getDoc, deleteDoc, updateDoc, increment, Timestamp } from "firebase/firestore";
import dynamic from "next/dynamic";

// Dynamically import map component to avoid SSR issues
const LocationPicker = dynamic(
  () => import("./LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    ),
  }
);

function OrderSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet'>('cod');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser({ id: currentUser.uid, email: currentUser.email });
      // Get items from query params (ids)
      const ids = searchParams.get("ids");
      if (!ids) {
        setLoading(false);
        return;
      }
      const idArr = ids.split(",");
      // Fetch cart items by id
      const fetched: any[] = [];
      for (const id of idArr) {
        const docRef = doc(db, "cart", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          fetched.push({ id, ...snap.data() });
        }
      }
      setItems(fetched);
      
      // Get wallet balance
      const walletRef = doc(db, "wallets", currentUser.uid);
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        setWalletBalance(walletSnap.data().balance || 0);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, searchParams]);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (deliveryOption === 'delivery' && !deliveryAddress.trim()) {
      alert("Please enter a delivery address or select a location on the map.");
      return;
    }
    if (deliveryOption === 'delivery' && (!deliveryDate || !deliveryTime)) {
      alert("Please select delivery date and time.");
      return;
    }
    if (deliveryOption === 'pickup' && (!pickupDate || !pickupTime)) {
      alert("Please select pickup date and time.");
      return;
    }
    
    const totalAmount = calculateTotal();
    
    // Check wallet balance if paying with wallet
    if (paymentMethod === 'wallet' && walletBalance < totalAmount) {
      alert(`Insufficient wallet balance. Your balance is ₱${walletBalance.toFixed(2)} but order total is ₱${totalAmount.toFixed(2)}`);
      return;
    }
    
    setProcessingOrder(true);
    
    try {
      for (const item of items) {
        const orderData: any = {
          buyerId: user.id,
          farmerId: item.farmerId || "",
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          photo: item.photo,
          status: "pending",
          createdAt: new Date(),
          deliveryOption,
          paymentMethod: paymentMethod,
          paymentStatus: paymentMethod === 'wallet' ? 'completed' : 'pending',
        };
        if (deliveryOption === 'delivery') {
          orderData.deliveryAddress = deliveryAddress;
          orderData.deliveryDate = deliveryDate;
          orderData.deliveryTime = deliveryTime;
          orderData.deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
          orderData.requiresDelivery = true;
          if (deliveryLocation) {
            orderData.deliveryLocation = deliveryLocation;
          }
        } else {
          orderData.pickupDate = pickupDate;
          orderData.pickupTime = pickupTime;
          orderData.pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
          orderData.requiresDelivery = false;
        }
        await addDoc(collection(db, "orders"), orderData);
        // Remove from cart
        await deleteDoc(doc(db, "cart", item.id));
      }
      
      // If paid with wallet, deduct from balance and create transaction
      if (paymentMethod === 'wallet') {
        const walletRef = doc(db, "wallets", user.id);
        await updateDoc(walletRef, {
          balance: increment(-totalAmount),
          updatedAt: new Date()
        });
        
        // Create wallet transaction
        await addDoc(collection(db, "wallet_transactions"), {
          userId: user.id,
          type: 'payment',
          amount: totalAmount,
          description: `Payment for ${items.length} item(s)`,
          status: 'completed',
          createdAt: new Date()
        });
      }
      
      const message = paymentMethod === 'wallet' 
        ? 'Order placed and paid successfully!' 
        : 'Order placed successfully! Payment will be collected on delivery/pickup.';
      alert(message);
      router.push("/dashboard/user/orders");
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Error placing order. Please try again.");
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>;
  }
  if (!items.length) {
    return <div className="flex h-screen items-center justify-center"><p>No items to order.</p></div>;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order Summary</h1>
      <div className="bg-white rounded shadow p-4 mb-6">
        {items.map(item => (
          <div key={item.id} className="mb-3 border-b pb-2 last:border-b-0 last:pb-0">
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-gray-600">Qty: {item.quantity} × ₱{item.price}</div>
            <div className="text-sm text-gray-500">Total: ₱{(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
        <div className="font-bold text-right mt-2">Grand Total: ₱{calculateTotal().toFixed(2)}</div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Choose an option:</label>
        <div className="flex gap-4 mb-3">
          <button
            className={`flex-1 px-4 py-2 rounded border ${deliveryOption === 'delivery' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300'}`}
            onClick={() => setDeliveryOption('delivery')}
          >
            🚚 Delivery
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded border ${deliveryOption === 'pickup' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
            onClick={() => setDeliveryOption('pickup')}
          >
            📦 Pickup
          </button>
        </div>
        {deliveryOption === 'delivery' && (
          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Delivery Address <span className="text-red-500">*</span></label>
              <textarea
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                placeholder="Enter your complete delivery address"
                rows={3}
                required
              />
              
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>📍</span>
                <span>{showMap ? 'Hide Map' : 'Pin Location on Map'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Delivery Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Delivery Time <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={e => setDeliveryTime(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            {showMap && (
              <div className="mt-4">
                <LocationPicker
                  location={deliveryLocation}
                  onLocationChange={(lat, lng, address) => {
                    setDeliveryLocation({ lat, lng });
                    if (address) setDeliveryAddress(address);
                  }}
                />
                {deliveryLocation && deliveryAddress && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">📍</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1">Selected Location:</p>
                        <p className="text-sm text-gray-700">{deliveryAddress}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Coordinates: {deliveryLocation.lat.toFixed(6)}, {deliveryLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {deliveryOption === 'pickup' && (
          <div className="mb-4 flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Pickup Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Pickup Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={pickupTime}
                onChange={e => setPickupTime(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div className="mb-6 bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">💳 Payment Method</h2>
        
        {/* Wallet Option */}
        <div
          className={`p-4 border-2 rounded-lg mb-3 cursor-pointer transition-all ${
            paymentMethod === 'wallet'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 bg-white hover:border-purple-300'
          }`}
          onClick={() => setPaymentMethod('wallet')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'wallet'
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-gray-300 bg-white'
              }`}>
                {paymentMethod === 'wallet' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">HarvestHub Wallet</p>
                <p className="text-sm text-gray-600">
                  Available: ₱{walletBalance.toFixed(2)}
                  {walletBalance < calculateTotal() && (
                    <span className="text-red-600 ml-2">(Insufficient balance)</span>
                  )}
                </p>
              </div>
            </div>
            <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* COD Option */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            paymentMethod === 'cod'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
          onClick={() => setPaymentMethod('cod')}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === 'cod'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300 bg-white'
            }`}>
              {paymentMethod === 'cod' && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                Cash on {deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}
              </p>
              <p className="text-sm text-gray-600">
                Pay ₱{calculateTotal().toFixed(2)} when you receive your order
              </p>
            </div>
          </div>
        </div>

        {paymentMethod === 'wallet' && walletBalance < calculateTotal() && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 Need to top up? Visit{" "}
              <a href="/dashboard/user/wallet" className="font-semibold underline">
                My Wallet
              </a>{" "}
              to add funds
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          onClick={() => router.back()}
          disabled={processingOrder}
        >
          Cancel
        </button>
        <button
          className={`flex-1 px-4 py-2 text-white rounded transition-colors ${
            deliveryOption === 'delivery' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handlePlaceOrder}
          disabled={processingOrder}
        >
          {processingOrder ? 'Processing...' : `Place Order (₱${calculateTotal().toFixed(2)})`}
        </button>
      </div>
    </div>
  );
}

export default function OrderSummaryPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><p>Loading...</p></div>}>
      <OrderSummaryContent />
    </Suspense>
  );
}
