# 🇵🇭 GCash API Setup Guide - Step by Step

## 📍 Where to Get GCash API Credentials

### Official GCash Mini Program Platform
**URL:** https://miniprogram.gcash.com/

---

## 📋 Step-by-Step Registration Process

### Step 1: Access the Platform
1. Go to https://miniprogram.gcash.com/
2. Click **"Log In"** button (top right corner)
3. If you don't have an account, click **"Register"** or **"Sign Up"**

### Step 2: Create Account
1. Fill in registration form:
   - Company/Business Name
   - Email Address
   - Contact Number
   - Business Type (Individual/Company)
2. Verify your email
3. Complete KYC (Know Your Customer) requirements:
   - Business Registration Documents
   - Valid ID
   - Proof of Address
   - Tax Identification Number (TIN)

### Step 3: Access Developer Platform
1. After account approval, log in to the platform
2. Navigate to: **Platform User's Guide** → **Manage Mini Programs**
3. Click **"Create Mini Program"** or **"Create App"**

### Step 4: Get API Credentials
Once your Mini Program is created, you'll receive:

#### Required Credentials:
1. **App ID** (Application ID)
   - Unique identifier for your application
   - Format: Usually alphanumeric string

2. **Private Key**
   - Your secret key for signing requests
   - Keep this EXTREMELY SECURE
   - Never commit to version control

3. **GCash Public Key**
   - Used to verify responses from GCash
   - Can be shared publicly

4. **Partner Code**
   - Your merchant/partner identifier
   - Assigned by GCash

5. **Merchant ID** (if applicable)
   - For payment processing
   - Linked to your settlement account

---

## 🔑 Where to Find Your Credentials

### In GCash Mini Program Dashboard:

1. **Log in** to https://miniprogram.gcash.com/
2. Go to: **My Mini Programs** or **Applications**
3. Select your Mini Program/App
4. Navigate to: **Settings** → **Developer Settings** or **API Keys**
5. You should see:
   ```
   App ID: xxxxxxxxxxxxxxxx
   Private Key: [Download] or [View]
   Public Key: [View]
   Partner Code: XXXXXX
   ```

---

## 📱 GCash API Types

### 1. Mini Program APIs
- For Mini Programs running inside GCash app
- Access to GCash payment, user info, etc.
- **Documentation:** https://miniprogram.gcash.com/docs/miniprogram_gcash/mpdev/api_overview

### 2. Open APIs (What You Need for HarvestHub)
- For external applications/websites
- Payment processing
- Payouts/Transfers
- **Documentation:** https://miniprogram.gcash.com/docs/miniprogram_gcash/mpdev/xxpbkg

### 3. JavaScript APIs
- For frontend integration
- **Documentation:** https://miniprogram.gcash.com/docs/miniprogram_gcash/mpdev/api_overview

---

## 🏦 API Endpoints

### Sandbox (Testing):
```
Base URL: https://sandbox.gcash.com/api
Payment API: https://sandbox.gcash.com/api/v1/payments
Payout API: https://sandbox.gcash.com/api/v1/payouts
```

### Production (Live):
```
Base URL: https://api.gcash.com
Payment API: https://api.gcash.com/v1/payments
Payout API: https://api.gcash.com/v1/payouts
```

---

## 🔐 Authentication Method

GCash uses **RSA Signature** for authentication:

### Step 1: Generate Request Signature
```typescript
import crypto from 'crypto';

function signRequest(params: any, privateKey: string) {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result: any, key) => {
      result[key] = params[key];
      return result;
    }, {});
  
  // Create query string
  const queryString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  // Sign with private key
  const sign = crypto.createSign('SHA256');
  sign.update(queryString);
  sign.end();
  
  const signature = sign.sign(privateKey, 'base64');
  return signature;
}
```

### Step 2: Add Signature to Request
```typescript
const params = {
  app_id: 'your_app_id',
  method: 'pay.create',
  timestamp: Date.now(),
  amount: 10000, // in centavos (100.00 PHP)
  // ... other params
};

const signature = signRequest(params, PRIVATE_KEY);

// Add signature to params
params.sign = signature;

// Make API request
const response = await fetch('https://api.gcash.com/v1/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(params)
});
```

---

## 🛠️ Required Documents for API Access

### For Individual Merchants:
- ✅ Valid Government-issued ID
- ✅ Proof of Billing/Address
- ✅ TIN (Tax Identification Number)
- ✅ Bank Account Information

### For Business/Company:
- ✅ SEC/DTI Registration Certificate
- ✅ Business Permit
- ✅ TIN (Company)
- ✅ Valid ID of Authorized Representative
- ✅ Corporate Bank Account
- ✅ Board Resolution (if corporation)

---

## 💰 GCash Fees

### For Payments (Receiving Money):
- **Transaction Fee:** 2.5% - 3.5% per transaction
- **Settlement:** T+1 to T+3 (1-3 business days)
- **Minimum:** PHP 10.00
- **Maximum:** PHP 50,000 per transaction

### For Payouts (Sending Money):
- **Transaction Fee:** PHP 15 - PHP 25 per payout
- **Processing Time:** Instant to 24 hours
- **Minimum:** PHP 100.00
- **Maximum:** PHP 50,000 per day per recipient

### Monthly Fees:
- **Platform Fee:** May vary based on volume
- **API Access:** Usually free after approval
- **Support:** May have tiered support fees

---

## 🧪 Testing Your Integration

### Sandbox Environment:

1. **Test App ID:**
   ```
   app_id: 2021xxxxxxxx (provided by GCash)
   ```

2. **Test Mobile Numbers:**
   ```
   09123456789 (Success)
   09987654321 (Failed)
   09111111111 (Pending)
   ```

3. **Test OTP:**
   ```
   123456 (always works in sandbox)
   ```

4. **Test Amounts:**
   ```
   PHP 100.00 - Success
   PHP 999.99 - Fail
   PHP 555.55 - Pending
   ```

---

## 📞 Contact GCash Support

### For API Access Issues:
- **Email:** developer@gcash.com
- **Support Portal:** https://miniprogram.gcash.com/ (Help Center)
- **Phone:** +63 2 7798 7777 (GCash Customer Service)
- **Hours:** Monday - Sunday, 24/7

### For Business Inquiries:
- **Email:** business@gcash.com
- **Partner Portal:** https://miniprogram.gcash.com/

---

## 🚨 Common Issues & Solutions

### Issue 1: Can't Find API Keys
**Solution:**
- Ensure your account is fully verified (KYC completed)
- Check if your Mini Program/App is approved
- Contact GCash support if keys are not visible after approval

### Issue 2: "Invalid Signature" Error
**Solution:**
- Check if your private key is correct
- Ensure parameters are sorted alphabetically before signing
- Verify timestamp format (Unix timestamp in milliseconds)
- Check if all required parameters are included

### Issue 3: "Merchant Not Found"
**Solution:**
- Verify your App ID and Partner Code
- Ensure you're using the correct environment (sandbox vs production)
- Check if your account is activated for API access

### Issue 4: Payment Timeout
**Solution:**
- Implement webhook for payment confirmation
- Don't rely only on redirect URL
- Set proper timeout values (30-60 seconds)
- Have a fallback to check payment status manually

---

## 📝 Environment Variables Setup

After getting your credentials, add to `.env.local`:

```bash
# GCash API Configuration
GCASH_APP_ID=your_app_id_here
GCASH_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
GCASH_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
GCASH_PARTNER_CODE=XXXXXX
GCASH_MERCHANT_ID=your_merchant_id

# Environment
GCASH_API_URL=https://sandbox.gcash.com/api # or https://api.gcash.com for production
GCASH_ENV=sandbox # or production

# Webhook
GCASH_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ✅ Pre-Launch Checklist

Before going live with GCash payments:

- [ ] Account fully verified (KYC complete)
- [ ] API credentials obtained and secured
- [ ] Sandbox testing completed successfully
- [ ] Webhook handler implemented and tested
- [ ] Error handling in place
- [ ] Settlement bank account configured
- [ ] Terms and conditions reviewed
- [ ] User flow tested end-to-end
- [ ] Security audit completed
- [ ] Production credentials obtained
- [ ] Go-live approval from GCash

---

## 📚 Additional Resources

### Official Documentation:
- **Main Site:** https://miniprogram.gcash.com/
- **Getting Started:** https://miniprogram.gcash.com/docs/miniprogram_gcash/getting-started/getting-started-guide
- **Developer Guide:** https://miniprogram.gcash.com/docs/miniprogram_gcash/mpdev/developer-guide
- **Open APIs:** https://miniprogram.gcash.com/docs/miniprogram_gcash/mpdev/xxpbkg
- **Platform Guide:** https://miniprogram.gcash.com/docs/miniprogram_gcash/platform/overview

### Community:
- **GCash Developer Forum:** (Check official site)
- **Facebook Group:** GCash Merchants & Developers
- **Tech Support:** developer@gcash.com

---

## 🎯 Quick Start Summary

1. ✅ **Register** at https://miniprogram.gcash.com/
2. ✅ **Complete KYC** with business documents
3. ✅ **Create Mini Program** or API App
4. ✅ **Get credentials:** App ID, Private Key, Partner Code
5. ✅ **Test in sandbox** with test credentials
6. ✅ **Implement** payment and payout APIs
7. ✅ **Setup webhooks** for payment confirmation
8. ✅ **Go live** after approval

---

**Last Updated:** November 13, 2025
**Platform:** GCash Mini Program Platform
**Region:** Philippines
**Currency:** PHP (Philippine Peso)

**Status:** 📖 Ready to Use
**Next Step:** Register at https://miniprogram.gcash.com/ and follow the steps above!
