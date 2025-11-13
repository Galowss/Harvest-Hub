# New Features Implementation Guide

## Overview
This document outlines the major features that have been added to the HarvestHub system to enhance the farmer-to-consumer marketplace experience.

## 🆕 Latest Updates (November 2025)

### ✨ DA Philippines Integration & AI Market Forecasting
- **Real-time pricing data** from Department of Agriculture Philippines
- **AI-powered price predictions** for 1 week, 2 weeks, and 1 month ahead
- **Market demand forecasting** (High/Medium/Low)
- **Optimal sale period recommendations**
- **Confidence-scored predictions** (60-95% reliability)

See detailed documentation: [`AI_FORECASTING_DOCUMENTATION.md`](./AI_FORECASTING_DOCUMENTATION.md)

---

## 1. Real-Time Pricing Dashboard

### Location
`/dashboard/farmer/pricing`

### Purpose
Helps farmers make informed pricing decisions by providing real-time market insights and competitive analysis.

### Key Features

#### Market Insights by Category
- **Average Price**: Shows the average market price for each product category
- **Price Range**: Displays minimum and maximum prices in the market
- **Market Trends**: Indicates whether prices are trending up (↑), down (↓), or stable (→)
- **Product Count**: Shows how many products are in each category
- **Trend Percentage**: Shows the percentage change in market prices

#### Personal Pricing Analytics
- **Your Average Price**: Displays the farmer's average product pricing
- **Market Average**: Shows overall market average for comparison
- **Competitiveness Status**: 
  - ✓ Competitive (within 10% of market average)
  - ↑ Above Market (>10% higher than market)
  - ↓ Below Market (>10% lower than market)
- **Suggested Price**: Recommends competitive pricing (typically 5% below market average)

#### Product Comparison Table
- Side-by-side comparison of farmer's products vs. market averages
- Real-time status indicators for each product
- Category-based filtering

### How to Use
1. Navigate to **Dashboard** → **Market Pricing**
2. View market trends by category
3. Compare your product prices with market averages
4. Adjust your pricing strategy based on insights
5. Filter by specific categories using the dropdown

### Benefits
- Make data-driven pricing decisions
- Stay competitive in the market
- Identify pricing opportunities
- Maximize profit margins while staying competitive

---

## 2. Digital Payment and Wallet System

### Locations
- Farmers: `/dashboard/farmer/wallet`
- Users: `/dashboard/user/wallet`

### Purpose
Enables cashless transactions, immediate payouts to farmers, and streamlined payment management for users.

### Farmer Wallet Features

#### Balance Overview
- **Available Balance**: Money ready to be withdrawn
- **Total Earnings**: Lifetime earnings from completed orders
- **Pending Amount**: Money from pending/in-transit orders
- **Total Withdrawals**: Historical withdrawal amount

#### Withdrawal System
- Instant withdrawal requests
- Transfer to registered bank account
- Processing time: 1-3 business days
- Transaction tracking with unique IDs

#### Transaction History
- Complete record of all financial transactions
- Types: Payments, Withdrawals, Refunds
- Status tracking: Pending, Completed, Failed
- Detailed descriptions and timestamps

### User Wallet Features

#### Balance Management
- **Wallet Balance**: Available funds for purchases
- **Total Spent**: Lifetime purchase history
- **Pending Payments**: Money reserved for pending orders

#### Top-Up System
- Add funds via multiple payment methods:
  - Credit/Debit Cards
  - GCash
  - PayMaya
  - Bank Transfer
- Instant balance updates
- Secure payment processing

#### Transaction Tracking
- View all top-ups and purchases
- Refund history
- Real-time status updates

### How to Use (Farmers)
1. Navigate to **Dashboard** → **Digital Wallet**
2. View your current balance and earnings
3. Click **Withdraw Funds** to cash out
4. Enter withdrawal amount
5. Confirm transaction
6. Funds transferred within 1-3 business days

### How to Use (Users)
1. Navigate to **Dashboard** → **Digital Wallet**
2. Click **Top Up Wallet** to add funds
3. Enter desired amount
4. Select payment method
5. Complete payment
6. Use wallet balance for purchases

### Benefits
- **For Farmers**:
  - Immediate payment upon order completion
  - No waiting for bank transfers
  - Complete financial transparency
  - Easy withdrawal process

- **For Users**:
  - Cashless shopping experience
  - Quick checkout process
  - Transaction history at fingertips
  - Secure payment handling

---

## 3. Enhanced Order and Delivery Management System

### Location
`/dashboard/farmer/orders` (Enhanced existing feature)

### Purpose
Streamlines logistics and provides better order tracking for both farmers and customers.

### Key Enhancements

#### Delivery Options
- **Delivery**: Direct delivery to customer's address
- **Pickup**: Customer picks up from farm/designated location

#### Order Status Management
1. **Pending**: Order placed, awaiting farmer action
2. **Out for Delivery**: Order shipped/in transit
3. **Completed**: Order delivered/picked up successfully
4. **Cancelled**: Order cancelled by farmer

#### Tracking System
- Auto-generated tracking numbers for deliveries
- Format: `TRK-{timestamp}-{random}`
- Real-time status updates
- Delivery timestamp recording

#### Stock Management Integration
- Automatic stock deduction upon order completion
- Stock validation before order completion
- Prevents overselling
- Real-time inventory updates

#### Visual Enhancements
- Product images displayed on order cards
- Delivery/Pickup badges for easy identification
- Address display for delivery orders
- Pickup schedule display (date & time)
- Color-coded status indicators

### Workflow (Farmers)

#### For Delivery Orders
1. Customer places order → Status: **Pending**
2. Farmer clicks **Mark for Delivery** → Status: **Out for Delivery**
   - System generates tracking number
   - Records delivery start time
3. Upon delivery, click **Mark as Delivered** → Status: **Completed**
   - Product stock automatically reduced
   - Payment credited to farmer wallet

#### For Pickup Orders
1. Customer places order → Status: **Pending**
2. Farmer prepares order
3. Click **Ready for Pickup** → Status: **Completed**
   - Stock automatically reduced
   - Payment credited to farmer wallet

### Features
- **Order Cancellation**: Cancel orders with confirmation
- **Delivery Tracking**: Unique tracking numbers for customers
- **Image Display**: Product photos on order cards
- **Address Management**: Clear display of delivery addresses
- **Schedule Display**: Pickup date and time clearly shown
- **Status Indicators**: Color-coded badges for quick status identification

### Benefits
- Streamlined order processing
- Better logistics coordination
- Automated inventory management
- Improved customer communication
- Reduced errors and confusion
- Complete order history tracking

---

## Technical Implementation Details

### Database Structure

#### Collections Used
1. **products**: Product listings with images, prices, stock
2. **orders**: Order details, status, delivery information
3. **wallets**: User and farmer wallet balances
4. **transactions**: Financial transaction history
5. **users**: User profiles and roles

#### Key Fields Added
- `wallets.balance`: Current wallet balance
- `wallets.totalEarnings`: Lifetime earnings (farmers)
- `wallets.totalWithdrawals`: Total withdrawn amount (farmers)
- `wallets.totalSpent`: Total purchase amount (users)
- `transactions.type`: credit, debit, withdrawal, payment, refund
- `orders.trackingNumber`: Unique delivery tracking ID
- `orders.deliveryStatus`: Current delivery state
- `orders.deliveryStartedAt`: Timestamp of delivery start
- `orders.deliveredAt`: Timestamp of delivery completion

### Security Considerations
- User authentication required for all wallet operations
- Role-based access (farmers vs. users)
- Transaction validation before processing
- Balance verification for withdrawals
- Secure payment gateway integration

### Future Enhancements
1. **Real-time Price Updates**: Integrate with actual market data APIs
2. **Payment Gateway Integration**: Connect with real payment processors
3. **SMS/Email Notifications**: Alerts for transactions and deliveries
4. **Analytics Dashboard**: Detailed financial and sales analytics
5. **Multi-currency Support**: Support for different currencies
6. **Automated Pricing Suggestions**: AI-based price optimization
7. **Delivery Route Optimization**: GPS-based delivery routing
8. **Customer Ratings Integration**: Link ratings with wallet incentives

---

## Navigation Structure

### Farmer Dashboard
```
├── Dashboard (Product Management)
├── Profile
├── Orders (Enhanced with delivery management)
├── Market Pricing (NEW)
├── Digital Wallet (NEW)
└── Ratings
```

### User Dashboard
```
├── Dashboard (Browse Products)
├── Cart
├── Orders
├── Digital Wallet (NEW)
├── Rate Farmer
└── Profile
```

---

## Access URLs

### Farmer Features
- Main Dashboard: `/dashboard/farmer`
- Market Pricing: `/dashboard/farmer/pricing`
- Digital Wallet: `/dashboard/farmer/wallet`
- Orders: `/dashboard/farmer/orders`

### User Features
- Main Dashboard: `/dashboard/user`
- Digital Wallet: `/dashboard/user/wallet`
- Orders: `/dashboard/user/orders`
- Cart: `/dashboard/user/cart`

---

## Summary

These three features work together to create a comprehensive marketplace ecosystem:

1. **Real-Time Pricing Dashboard**: Empowers farmers with market intelligence
2. **Digital Wallet System**: Enables seamless cashless transactions
3. **Enhanced Order Management**: Streamlines the entire order-to-delivery process

Together, they provide:
- Better pricing strategies for farmers
- Faster, more convenient payments
- Improved order tracking and logistics
- Enhanced user experience
- Complete financial transparency
- Professional marketplace operations

All features are fully integrated with the existing HarvestHub system and maintain the same design language and user experience standards.
