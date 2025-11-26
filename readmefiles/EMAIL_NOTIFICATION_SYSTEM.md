# 📧 Email Notification System

## Overview
HarvestHub now includes an automated email notification system that keeps farmers and buyers informed about order status updates in real-time.

## Features

### For Farmers
- **New Order Notifications**: Receive instant email alerts when a buyer places an order
- Includes complete order details, buyer information, delivery method, and amount

### For Buyers
- **Order Confirmed**: Get notified when farmer confirms your order
- **Out for Delivery**: Receive notification when order is dispatched
- **Delivered**: Get confirmation when order is successfully delivered

## Notification Types

### 1. New Order (Farmer)
**Triggered when**: Buyer places an order
**Recipients**: Farmer
**Information includes**:
- Order ID
- Product name and quantity
- Buyer name
- Delivery method (Delivery/Pickup)
- Delivery address (if applicable)
- Total amount
- Link to view order in dashboard

### 2. Order Confirmed (Buyer)
**Triggered when**: Farmer confirms the order
**Recipients**: Buyer
**Information includes**:
- Order ID
- Product details
- Confirmation status
- Estimated delivery/pickup time
- Link to track order

### 3. Out for Delivery (Buyer)
**Triggered when**: Farmer marks order as out for delivery
**Recipients**: Buyer
**Information includes**:
- Order ID
- Product details
- Delivery address
- Tracking information
- Link to track order

### 4. Order Delivered (Buyer)
**Triggered when**: Farmer marks order as delivered
**Recipients**: Buyer
**Information includes**:
- Order ID
- Product details
- Delivery confirmation
- Request to rate farmer
- Link to rating page

## Technical Implementation

### Files Created/Modified

1. **API Route**: `app/api/send-notification/route.ts`
   - Handles notification sending
   - Logs notifications (ready for email service integration)

2. **Utility Library**: `lib/notifications.ts`
   - `sendNotification()`: Main function to send notifications
   - `generateOrderNotificationEmail()`: Creates HTML email templates
   - Beautiful, responsive email templates with HarvestHub branding

3. **Order Summary Page**: `app/dashboard/user/order-summary/page.tsx`
   - Sends "New Order" notification to farmer when order is placed
   - Includes buyer information in order data

4. **Farmer Orders Page**: `app/dashboard/farmer/orders/page.tsx`
   - Sends status update notifications to buyer
   - Handles: Confirmed, Out for Delivery, Delivered statuses

## Email Templates

All emails feature:
- ✅ Professional HarvestHub branding
- ✅ Responsive design (mobile-friendly)
- ✅ Clear order information
- ✅ Call-to-action buttons
- ✅ Gradient headers with appropriate colors
- ✅ Order status badges
- ✅ Direct links to dashboard

### Color Schemes by Type:
- **New Order**: Green gradient (🎉 Celebration)
- **Order Confirmed**: Blue gradient (✅ Confirmation)
- **Out for Delivery**: Orange gradient (🚚 In Transit)
- **Delivered**: Green gradient (✅ Success)

## Integration with Email Services

The notification system is ready for integration with email services. To enable actual email sending:

### Option 1: SendGrid (Recommended)
```bash
npm install @sendgrid/mail
```

Add to `.env.local`:
```
SENDGRID_API_KEY=your_api_key_here
```

### Option 2: Resend (Modern & Simple)
```bash
npm install resend
```

Add to `.env.local`:
```
RESEND_API_KEY=your_api_key_here
```

### Option 3: Nodemailer (Self-hosted)
```bash
npm install nodemailer
```

Add to `.env.local`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Current Behavior

Currently, notifications are **logged to console** instead of being sent via email. This allows:
- ✅ Testing notification flow without email service costs
- ✅ Viewing notification content in browser console
- ✅ Verifying all triggers work correctly
- ✅ Easy debugging

To view notifications:
1. Open browser console (F12)
2. Look for "📧 Email Notification:" logs
3. See complete notification details

## Future Enhancements

Potential additions:
- SMS notifications for urgent updates
- In-app notifications (push notifications)
- WhatsApp integration
- Customizable notification preferences
- Email templates customization by farmers
- Multi-language support
- Order reminder notifications
- Review request notifications

## Testing

To test notifications:
1. Place an order as a buyer
2. Check console for "New Order" notification to farmer
3. As farmer, update order status to "Confirmed"
4. Check console for "Order Confirmed" notification to buyer
5. Mark as "Out for Delivery"
6. Check console for delivery notification
7. Mark as "Delivered"
8. Check console for delivered notification with rating request

## Benefits

- 📧 **Instant Communication**: Both parties stay informed in real-time
- 🔔 **Professional**: Automated notifications improve service quality
- 📊 **Transparent**: Clear order status updates reduce confusion
- 💼 **Business Growth**: Better communication = Better customer satisfaction
- ⏰ **Time Saving**: Eliminates need for manual status updates
- 🎯 **Engagement**: Encourages buyers to rate farmers after delivery

## Notes

- All notifications include order details and direct links to dashboard
- Email templates are mobile-responsive
- System gracefully handles notification failures (doesn't block order processing)
- Ready for production with email service integration
- Follows email best practices (unsubscribe info, proper formatting)

---

**Status**: ✅ Implemented and Ready
**Last Updated**: November 26, 2025
