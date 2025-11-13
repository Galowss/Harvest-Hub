# 💳 GCash & PayPal Integration Guide

## Overview
HarvestHub's Digital Wallet System supports **GCash** and **PayPal** as the exclusive payment methods for top-ups and withdrawals.

---

## 🇵🇭 GCash Integration

### Why GCash?
- **Most popular e-wallet in the Philippines**
- Instant to 24-hour processing
- Wide acceptance among Filipino users
- Lower transaction fees
- Mobile-first design

### Current Implementation (Simulated)
```typescript
// In app/dashboard/user/wallet/page.tsx
const getPaymentMethod = () => {
  return "GCash/PayPal";
};
```

### For Production (Real GCash API):

#### Step 1: Register with GCash Mini Program Platform
1. **Go to:** https://miniprogram.gcash.com/
2. **Click "Log In"** (top right corner)
3. **Register for an account** in the Mini Program Platform
4. **Create a workspace** and assign roles for admins and developers
5. **Navigate to:** Developer's Guide → Open APIs
6. **Get your API credentials:**
   - App ID (Application ID)
   - Private Key
   - GCash Public Key
   - Partner Code

**Important Links:**
- Mini Program Platform: https://miniprogram.gcash.com/
- Getting Started: https://miniprogram.gcash.com/docs/miniprogram_gcash/getting-started/getting-started-guide
- Open APIs Documentation: https://miniprogram.gcash.com/docs/miniprogram_gcash/mpdev/xxpbkg
- API Reference: https://miniprogram.gcash.com/docs/miniprogram_gcash/mpdev/api_overview

#### Step 2: Install Dependencies
```bash
npm install axios
```

#### Step 3: Create GCash Payment Handler
Create `lib/gcash.ts`:
```typescript
import axios from 'axios';

const GCASH_API_URL = process.env.NEXT_PUBLIC_GCASH_API_URL || 'https://api.gcash.com';
const GCASH_CLIENT_ID = process.env.GCASH_CLIENT_ID;
const GCASH_CLIENT_SECRET = process.env.GCASH_CLIENT_SECRET;

// Get access token
async function getAccessToken() {
  const auth = Buffer.from(`${GCASH_CLIENT_ID}:${GCASH_CLIENT_SECRET}`).toString('base64');
  
  const response = await axios.post(`${GCASH_API_URL}/oauth/token`, {
    grant_type: 'client_credentials'
  }, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  return response.data.access_token;
}

// Create payment order
export async function createGCashPayment(
  amount: number,
  userId: string,
  returnUrl: string
) {
  const accessToken = await getAccessToken();
  
  const response = await axios.post(`${GCASH_API_URL}/v1/payments`, {
    amount: {
      currency: 'PHP',
      value: (amount * 100).toString() // Convert to centavos
    },
    description: 'HarvestHub Wallet Top-Up',
    redirectUrl: returnUrl,
    notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gcash`,
    metadata: {
      userId: userId,
      source: 'wallet_topup'
    }
  }, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  return {
    paymentId: response.data.id,
    paymentUrl: response.data.checkoutUrl,
    status: response.data.status
  };
}

// Verify payment status
export async function verifyGCashPayment(paymentId: string) {
  const accessToken = await getAccessToken();
  
  const response = await axios.get(`${GCASH_API_URL}/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return {
    status: response.data.status, // 'PENDING', 'SUCCESS', 'FAILED'
    amount: parseInt(response.data.amount.value) / 100, // Convert back from centavos
    transactionId: response.data.transactionId
  };
}
```

#### Step 4: Update Wallet Top-Up Handler
In `app/dashboard/user/wallet/page.tsx`:
```typescript
import { createGCashPayment, verifyGCashPayment } from '@/lib/gcash';

const handleTopUp = async () => {
  if (!user || !topUpAmount || parseFloat(topUpAmount) <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  setProcessing(true);

  try {
    const amount = parseFloat(topUpAmount);
    const returnUrl = `${window.location.origin}/dashboard/user/wallet?payment=success`;
    
    // Create GCash payment order
    const payment = await createGCashPayment(amount, user.id, returnUrl);
    
    // Store pending transaction
    const txRef = await addDoc(collection(db, "transactions"), {
      userId: user.id,
      type: "credit",
      amount: amount,
      description: `Wallet top-up via GCash`,
      status: "pending",
      paymentId: payment.paymentId,
      createdAt: Timestamp.now(),
    });
    
    // Redirect to GCash payment page
    window.location.href = payment.paymentUrl;
    
  } catch (error) {
    console.error("Error initiating GCash payment:", error);
    alert("Failed to initiate payment. Please try again.");
    setProcessing(false);
  }
};
```

#### Step 5: Create Webhook Handler
Create `app/api/webhooks/gcash/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/config/firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment, Timestamp } from 'firebase/firestore';
import { verifyGCashPayment } from '@/lib/gcash';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status } = body;
    
    // Verify payment with GCash API
    const paymentStatus = await verifyGCashPayment(paymentId);
    
    if (paymentStatus.status === 'SUCCESS') {
      // Find pending transaction
      const txQuery = query(
        collection(db, 'transactions'),
        where('paymentId', '==', paymentId),
        where('status', '==', 'pending')
      );
      const txSnapshot = await getDocs(txQuery);
      
      if (!txSnapshot.empty) {
        const txDoc = txSnapshot.docs[0];
        const txData = txDoc.data();
        
        // Update transaction to completed
        await updateDoc(doc(db, 'transactions', txDoc.id), {
          status: 'completed',
          completedAt: Timestamp.now(),
          transactionId: paymentStatus.transactionId
        });
        
        // Update wallet balance
        const walletRef = doc(db, 'wallets', txData.userId);
        await updateDoc(walletRef, {
          balance: increment(txData.amount),
          totalEarnings: increment(txData.amount),
          lastUpdated: Timestamp.now()
        });
        
        console.log(`✅ GCash payment completed: ₱${txData.amount} for user ${txData.userId}`);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('GCash webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

---

## 🌐 PayPal Integration

### Why PayPal?
- **International payments accepted**
- Trusted globally
- 1-3 business day processing
- Multi-currency support
- Buyer/Seller protection

### For Production (Real PayPal API):

#### Step 1: Register with PayPal Developer
1. Go to https://developer.paypal.com
2. Create developer account
3. Create REST API app
4. Get credentials:
   - Client ID
   - Secret Key

#### Step 2: Install PayPal SDK
```bash
npm install @paypal/checkout-server-sdk
```

#### Step 3: Create PayPal Payment Handler
Create `lib/paypal.ts`:
```typescript
import paypal from '@paypal/checkout-server-sdk';

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

const client = new paypal.core.PayPalHttpClient(environment());

// Create payment order
export async function createPayPalOrder(amount: number, userId: string) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'PHP',
        value: amount.toFixed(2)
      },
      description: 'HarvestHub Wallet Top-Up'
    }],
    application_context: {
      brand_name: 'HarvestHub',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/wallet?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/user/wallet?payment=cancelled`
    }
  });

  const response = await client.execute(request);
  
  return {
    orderId: response.result.id,
    approvalUrl: response.result.links.find((link: any) => link.rel === 'approve')?.href,
    status: response.result.status
  };
}

// Capture payment
export async function capturePayPalOrder(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  const response = await client.execute(request);
  
  return {
    status: response.result.status, // 'COMPLETED'
    amount: parseFloat(response.result.purchase_units[0].amount.value),
    transactionId: response.result.purchase_units[0].payments.captures[0].id
  };
}
```

#### Step 4: Update for PayPal Top-Up
In `app/dashboard/user/wallet/page.tsx`:
```typescript
import { createPayPalOrder, capturePayPalOrder } from '@/lib/paypal';

const handleTopUpPayPal = async () => {
  if (!user || !topUpAmount || parseFloat(topUpAmount) <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  setProcessing(true);

  try {
    const amount = parseFloat(topUpAmount);
    
    // Create PayPal order
    const order = await createPayPalOrder(amount, user.id);
    
    // Store pending transaction
    await addDoc(collection(db, "transactions"), {
      userId: user.id,
      type: "credit",
      amount: amount,
      description: `Wallet top-up via PayPal`,
      status: "pending",
      paymentId: order.orderId,
      createdAt: Timestamp.now(),
    });
    
    // Redirect to PayPal approval page
    if (order.approvalUrl) {
      window.location.href = order.approvalUrl;
    }
    
  } catch (error) {
    console.error("Error initiating PayPal payment:", error);
    alert("Failed to initiate payment. Please try again.");
    setProcessing(false);
  }
};
```

---

## 🏦 Withdrawal Integration

### GCash Withdrawal
```typescript
// For farmer withdrawals to GCash
export async function sendGCashPayout(gcashNumber: string, amount: number, farmerId: string) {
  const accessToken = await getAccessToken();
  
  const response = await axios.post(`${GCASH_API_URL}/v1/payouts`, {
    amount: {
      currency: 'PHP',
      value: (amount * 100).toString()
    },
    recipient: {
      type: 'MOBILE',
      mobile: gcashNumber // e.g., "09123456789"
    },
    description: 'HarvestHub Earnings Withdrawal',
    metadata: {
      farmerId: farmerId
    }
  }, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  return {
    payoutId: response.data.id,
    status: response.data.status // 'PROCESSING', 'COMPLETED', 'FAILED'
  };
}
```

### PayPal Withdrawal
```typescript
// For farmer withdrawals to PayPal
export async function sendPayPalPayout(paypalEmail: string, amount: number, farmerId: string) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await axios.post('https://api.paypal.com/v1/payments/payouts', {
    sender_batch_header: {
      sender_batch_id: `harvest_${Date.now()}`,
      email_subject: 'HarvestHub Earnings Withdrawal'
    },
    items: [{
      recipient_type: 'EMAIL',
      amount: {
        value: amount.toFixed(2),
        currency: 'PHP'
      },
      receiver: paypalEmail, // e.g., "farmer@email.com"
      note: 'HarvestHub earnings payout'
    }]
  }, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  return {
    batchId: response.data.batch_header.payout_batch_id,
    status: response.data.batch_header.batch_status // 'PENDING', 'PROCESSING', 'SUCCESS'
  };
}
```

---

## 📱 UI Updates

### Top-Up Modal with Payment Method Selection
```typescript
// In user wallet page
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">Payment Method</label>
  <div className="space-y-2">
    <button
      onClick={() => setPaymentMethod('gcash')}
      className={`w-full p-3 border-2 rounded-lg text-left ${
        paymentMethod === 'gcash' ? 'border-green-500 bg-green-50' : 'border-gray-300'
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">💳</span>
        <div>
          <p className="font-semibold">GCash</p>
          <p className="text-xs text-gray-600">Instant to 24 hours</p>
        </div>
      </div>
    </button>
    
    <button
      onClick={() => setPaymentMethod('paypal')}
      className={`w-full p-3 border-2 rounded-lg text-left ${
        paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">🌐</span>
        <div>
          <p className="font-semibold">PayPal</p>
          <p className="text-xs text-gray-600">1-3 business days</p>
        </div>
      </div>
    </button>
  </div>
</div>
```

---

## 🔐 Security Best Practices

### For GCash:
1. ✅ Store API credentials in environment variables
2. ✅ Use webhook signature verification
3. ✅ Implement rate limiting
4. ✅ Log all transactions
5. ✅ Validate payment amounts on server-side

### For PayPal:
1. ✅ Use OAuth 2.0 authentication
2. ✅ Verify webhook signatures
3. ✅ Implement idempotency keys
4. ✅ Handle currency conversions properly
5. ✅ Store transaction IDs for disputes

---

## 📊 Transaction Monitoring

### Create Admin Dashboard for Monitoring:
```typescript
// Track pending payments
const pendingPayments = await getDocs(
  query(
    collection(db, 'transactions'),
    where('status', '==', 'pending'),
    where('type', '==', 'credit')
  )
);

// Alert for stuck payments (>30 minutes pending)
const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
pendingPayments.forEach(doc => {
  const tx = doc.data();
  if (tx.createdAt.toDate() < thirtyMinsAgo) {
    console.warn(`⚠️ Stuck payment: ${doc.id}`);
    // Send alert to admin
  }
});
```

---

## 🧪 Testing

### GCash Sandbox Testing:
```
Test Mobile Number: 09123456789
Test OTP: 123456
```

### PayPal Sandbox Testing:
```
Personal Account:
Email: sb-buyer@personal.example.com
Password: 12345678

Business Account:
Email: sb-seller@business.example.com
Password: 12345678
```

---

## 📝 Environment Variables

Add to `.env.local`:
```bash
# GCash
GCASH_CLIENT_ID=your_gcash_client_id
GCASH_CLIENT_SECRET=your_gcash_client_secret
GCASH_API_URL=https://sandbox.gcash.com # or https://api.gcash.com for production

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your production URL
```

---

## 🚀 Deployment Checklist

- [ ] GCash production credentials obtained
- [ ] PayPal production credentials obtained
- [ ] Webhook endpoints deployed and tested
- [ ] SSL certificate installed (HTTPS required)
- [ ] Environment variables set in production
- [ ] Transaction monitoring dashboard ready
- [ ] Error alerting system configured
- [ ] Customer support process defined
- [ ] Refund policy documented
- [ ] Privacy policy updated with payment info

---

**Status:** Ready for Integration
**Documentation Updated:** 2025
**Payment Methods:** GCash & PayPal Only
