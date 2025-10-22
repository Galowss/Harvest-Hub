# Delivery and Pickup Feature Documentation

## Overview
The delivery/pickup feature enables buyers to choose between home delivery or scheduled pickup when placing orders. Farmers can then process orders accordingly based on the buyer's preference.

## Features Implemented

### For Buyers (Customer Side)

#### Checkout Options Modal:
When placing an order from the cart or buying directly, buyers are presented with two options:

1. **🚚 Delivery Option**
   - Buyer enters complete delivery address
   - Farmer will deliver the order to the specified location
   - Tracking number generated when order is marked for delivery
   - Real-time delivery status tracking

2. **📦 Pickup Option**
   - Buyer selects preferred pickup date (must be today or future date)
   - Buyer selects preferred pickup time
   - Order will be ready at the scheduled date/time
   - No delivery needed - customer picks up in person

#### Order Placement Flow:
1. Add items to cart OR click "Order Now" on a product
2. Click "Checkout" button
3. Modal appears with delivery/pickup options
4. Choose delivery:
   - Enter complete delivery address (street, barangay, city, province)
   - Click "Confirm Order"
5. OR choose pickup:
   - Select pickup date (date picker with minimum date = today)
   - Select pickup time (time picker)
   - Click "Confirm Order"
6. Order is created with chosen delivery method

#### Order Tracking Features:
- **Delivery Orders:**
  - Shows "🚚 Delivery" badge
  - Displays delivery address
  - Shows tracking number when out for delivery
  - Delivery progress tracking

- **Pickup Orders:**
  - Shows "📦 Pickup" badge
  - Displays scheduled pickup date and time
  - Shows "Ready for Pickup" when farmer marks it ready
  - Pickup completion tracking

### For Farmers (Seller Side)

#### Order Management by Type:

**Delivery Orders:**
1. **Pending** → Farmer clicks "🚚 Mark for Delivery"
   - Generates tracking number
   - Status changes to "Out for Delivery"
2. **Out for Delivery** → Farmer clicks "✓ Mark as Delivered"
   - Status changes to "Completed"
   - Product stock is updated
   - Delivery timestamp recorded

**Pickup Orders:**
1. **Pending** → Farmer clicks "✓ Ready for Pickup"
   - Status changes to "Completed"
   - Product stock is updated
   - Buyer can now pick up the order

#### Farmer Dashboard Display:
- Order cards show delivery/pickup badge
- Delivery orders display the delivery address
- Pickup orders display scheduled pickup date and time
- Context-aware action buttons based on order type

## Database Schema Updates

### Orders Collection
New fields added to order documents:
```typescript
{
  // Order type
  deliveryOption: "delivery" | "pickup",
  requiresDelivery: boolean,
  
  // Delivery-specific fields
  deliveryAddress: string,
  deliveryStatus: "out-for-delivery" | "delivered",
  trackingNumber: string,
  deliveryStartedAt: Timestamp,
  deliveredAt: Timestamp,
  
  // Pickup-specific fields
  pickupDate: string,  // YYYY-MM-DD format
  pickupTime: string,  // HH:MM format
  pickupDateTime: Timestamp,
  
  // General fields
  status: "pending" | "out-for-delivery" | "completed" | "cancelled",
  cancelledAt: Timestamp
}
```

## UI/UX Enhancements

### Modal Design:
- Clean, modern checkout modal
- Radio-style selection for delivery/pickup
- Conditional form fields based on selection
- Validation for required fields
- Visual feedback with color coding

### Color Coding:
- � Green: Delivery option and badges
- 🔵 Blue: Pickup option and badges
- � Yellow: Pending status
- 🔴 Red: Cancelled status

### Icons:
- 🚚 Delivery truck for delivery
- 📦 Package for pickup
- 📅 Calendar for pickup date
- 🕐 Clock for pickup time
- ✓ Checkmark for completion

## Implementation Files

### Modified Files:
1. **`app/dashboard/user/cart/page.tsx`**
   - Added checkout modal with delivery/pickup options
   - Added delivery address input field (textarea)
   - Added pickup date/time input fields
   - Updated `handleCheckout()` to include delivery/pickup data
   - Updated `handleOrderNow()` for single-item orders with modal
   - Added validation for delivery address and pickup schedule

2. **`app/dashboard/user/orders/page.tsx`**
   - Updated Order interface with delivery/pickup fields
   - Added delivery/pickup badges to order cards
   - Display delivery address for delivery orders
   - Display pickup schedule for pickup orders
   - Updated tracking display logic for delivery orders only
   - Context-aware completion messages

3. **`app/dashboard/farmer/orders/page.tsx`**
   - Added delivery/pickup badges to order cards
   - Display delivery address for farmers
   - Display pickup schedule for farmers
   - Context-aware action buttons:
     * "Mark for Delivery" for delivery orders
     * "Ready for Pickup" for pickup orders
   - Updated completion messages based on order type

4. **`firestore.rules`**
   - Updated to allow delivery/pickup field updates
   - No changes needed (already flexible for order updates)

## User Experience Flow

### Delivery Flow:
```
Buyer → Checkout → Choose Delivery → Enter Address → Confirm
  ↓
Order Created (pending, delivery)
  ↓
Farmer → Mark for Delivery (generates tracking)
  ↓
Order Status: Out for Delivery
  ↓
Farmer → Mark as Delivered
  ↓
Order Status: Completed (Delivered)
```

### Pickup Flow:
```
Buyer → Checkout → Choose Pickup → Select Date/Time → Confirm
  ↓
Order Created (pending, pickup)
  ↓
Farmer → Ready for Pickup
  ↓
Order Status: Completed (Picked Up)
  ↓
Buyer picks up at scheduled time
```

## Form Validation

### Delivery Validation:
- ✅ Delivery address is required
- ✅ Must be non-empty string
- ✅ Recommended: street, barangay, city, province

### Pickup Validation:
- ✅ Pickup date is required
- ✅ Must be today or future date (min date validation)
- ✅ Pickup time is required
- ✅ Time format: HH:MM (24-hour format)

## Testing Checklist

- [x] Cart checkout modal displays delivery/pickup options
- [x] "Order Now" modal displays delivery/pickup options
- [x] Delivery address field shows for delivery option
- [x] Pickup date/time fields show for pickup option
- [x] Form validation works correctly
- [x] Order is created with correct delivery/pickup data
- [x] Buyer's order page shows delivery/pickup information
- [x] Farmer's order page shows delivery/pickup information
- [x] Farmer sees correct action buttons per order type
- [x] Delivery orders show tracking number
- [x] Pickup orders show scheduled date/time
- [x] Order completion works for both types
- [x] Product stock updates correctly
- [x] Order cancellation still works

## Future Enhancements (Optional)

1. **Smart Delivery Estimations**
   - Calculate estimated delivery time based on address
   - Show delivery fee based on distance
   - Integration with mapping services

2. **Pickup Location Management**
   - Multiple pickup locations for farmers
   - Map showing pickup location
   - Directions to pickup point

3. **Notifications**
   - Email/SMS when order is ready for pickup
   - Email/SMS when delivery is out for delivery
   - Reminder for pickup appointments

4. **Pickup Time Slots**
   - Farmers can set available pickup time slots
   - Buyers choose from available slots
   - Prevent overbooking

5. **Delivery Preferences**
   - Save delivery addresses for future orders
   - Set default delivery method
   - Multiple saved addresses

6. **Advanced Tracking**
   - Real-time GPS tracking for deliveries
   - Delivery person contact information
   - Photo proof of delivery

7. **Pickup Confirmation**
   - QR code for pickup verification
   - Digital signature on pickup
   - Pickup history

## Support

For issues or questions about the delivery/pickup feature:
- Check browser console for error messages
- Verify Firestore rules allow order updates
- Ensure date/time inputs are properly formatted
- Check that delivery addresses are being saved correctly
