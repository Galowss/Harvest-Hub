// Notification utility functions
interface NotificationData {
  to: string;
  subject: string;
  html: string;
  type: 'new_order' | 'order_confirmed' | 'order_out_for_delivery' | 'order_delivered' | 'order_cancelled';
}

export async function sendNotification(data: NotificationData): Promise<boolean> {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to send notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export function generateOrderNotificationEmail(
  type: NotificationData['type'],
  orderData: {
    orderId: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    buyerName?: string;
    farmerName?: string;
    deliveryMethod?: string;
    deliveryAddress?: string;
  }
): { subject: string; html: string } {
  const { orderId, productName, quantity, totalPrice, buyerName, farmerName, deliveryMethod, deliveryAddress } = orderData;

  switch (type) {
    case 'new_order':
      return {
        subject: `🎉 New Order Received - Order #${orderId.slice(-8)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-label { font-weight: bold; color: #6b7280; }
              .detail-value { color: #111827; }
              .total { font-size: 1.2em; font-weight: bold; color: #16a34a; }
              .button { display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 0.9em; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 New Order Received!</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${farmerName}</strong>,</p>
                <p>Great news! You have received a new order from <strong>${buyerName}</strong>.</p>
                
                <div class="order-details">
                  <h3 style="margin-top: 0;">Order Details</h3>
                  <div class="detail-row">
                    <span class="detail-label">Order ID:</span>
                    <span class="detail-value">#${orderId.slice(-8)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Product:</span>
                    <span class="detail-value">${productName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Quantity:</span>
                    <span class="detail-value">${quantity}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Delivery Method:</span>
                    <span class="detail-value">${deliveryMethod === 'delivery' ? '🚚 Delivery' : '📦 Pickup'}</span>
                  </div>
                  ${deliveryAddress ? `
                  <div class="detail-row">
                    <span class="detail-label">Delivery Address:</span>
                    <span class="detail-value">${deliveryAddress}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row" style="border-bottom: none;">
                    <span class="detail-label total">Total Amount:</span>
                    <span class="detail-value total">₱${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Review the order details in your dashboard</li>
                  <li>Confirm the order and prepare the items</li>
                  <li>Update the order status as you progress</li>
                </ul>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/farmer/orders" class="button">View Order</a>
                </div>

                <div class="footer">
                  <p>Thank you for being part of HarvestHub! 🌾</p>
                  <p><small>This is an automated notification. Please do not reply to this email.</small></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'order_confirmed':
      return {
        subject: `✅ Order Confirmed - Order #${orderId.slice(-8)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .status-badge { background: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 0.9em; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Order Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${buyerName}</strong>,</p>
                <p>Your order has been confirmed by <strong>${farmerName}</strong>!</p>
                
                <div style="text-align: center;">
                  <span class="status-badge">Order Confirmed</span>
                </div>

                <div class="order-details">
                  <h3 style="margin-top: 0;">Order Summary</h3>
                  <div class="detail-row">
                    <span>Order ID:</span>
                    <span><strong>#${orderId.slice(-8)}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span>Product:</span>
                    <span>${productName}</span>
                  </div>
                  <div class="detail-row">
                    <span>Quantity:</span>
                    <span>${quantity}</span>
                  </div>
                  <div class="detail-row" style="border-bottom: none;">
                    <span>Total:</span>
                    <span><strong>₱${totalPrice.toFixed(2)}</strong></span>
                  </div>
                </div>

                <p>The farmer is now preparing your order. You'll receive another notification when it's ${deliveryMethod === 'delivery' ? 'out for delivery' : 'ready for pickup'}.</p>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/user/orders" class="button">Track Order</a>
                </div>

                <div class="footer">
                  <p>Thank you for choosing HarvestHub! 🌾</p>
                  <p><small>This is an automated notification. Please do not reply to this email.</small></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'order_out_for_delivery':
      return {
        subject: `🚚 Order Out for Delivery - Order #${orderId.slice(-8)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .status-badge { background: #f59e0b; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; }
              .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 0.9em; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚚 Order Out for Delivery!</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${buyerName}</strong>,</p>
                <p>Great news! Your order is now out for delivery!</p>
                
                <div style="text-align: center;">
                  <span class="status-badge">Out for Delivery</span>
                </div>

                <p><strong>Order #${orderId.slice(-8)}</strong></p>
                <p>Product: ${productName} (${quantity} pcs)</p>
                ${deliveryAddress ? `<p>Delivery Address: ${deliveryAddress}</p>` : ''}

                <p>Your order is on its way and should arrive soon. Please be available to receive it.</p>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/user/orders" class="button">Track Order</a>
                </div>

                <div class="footer">
                  <p>Thank you for choosing HarvestHub! 🌾</p>
                  <p><small>This is an automated notification. Please do not reply to this email.</small></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'order_delivered':
      return {
        subject: `✅ Order Delivered - Order #${orderId.slice(-8)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .status-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 20px 0; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 0.9em; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Order Delivered Successfully!</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${buyerName}</strong>,</p>
                <p>Your order has been delivered successfully! 🎉</p>
                
                <div style="text-align: center;">
                  <span class="status-badge">Delivered</span>
                </div>

                <p><strong>Order #${orderId.slice(-8)}</strong></p>
                <p>Product: ${productName} (${quantity} pcs)</p>
                <p>Total: ₱${totalPrice.toFixed(2)}</p>

                <p>We hope you enjoy your fresh products from <strong>${farmerName}</strong>!</p>

                <p><strong>Please rate your experience:</strong></p>
                <p>Your feedback helps us improve our service and helps other buyers make informed decisions.</p>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/user/rate_farmer" class="button">Rate Farmer</a>
                </div>

                <div class="footer">
                  <p>Thank you for choosing HarvestHub! 🌾</p>
                  <p><small>This is an automated notification. Please do not reply to this email.</small></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: `Order Update - Order #${orderId.slice(-8)}`,
        html: `<p>Your order #${orderId.slice(-8)} has been updated.</p>`,
      };
  }
}
