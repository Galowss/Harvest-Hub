// Browser-safe Event Client
// Publishes events via API routes instead of direct RabbitMQ connection

export class EventClient {
  private static async publishEvent(eventType: string, data: any): Promise<boolean> {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType, data }),
      });

      if (!response.ok) {
        console.error(`Failed to publish ${eventType}:`, await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error publishing ${eventType}:`, error);
      return false;
    }
  }

  static async publishOrderCreated(orderData: any) {
    return this.publishEvent('ORDER_CREATED', orderData);
  }

  static async publishOrderStatusUpdated(data: { 
    orderId: string; 
    status: string; 
    buyerId: string; 
    farmerId: string 
  }) {
    return this.publishEvent('ORDER_STATUS_UPDATED', data);
  }

  static async publishProductUpdated(data: { 
    productId: string; 
    farmerId: string; 
    action: string; 
    productName: string; 
    stock: number 
  }) {
    return this.publishEvent('PRODUCT_UPDATED', data);
  }

  static async publishNotification(userId: string, notification: any) {
    return this.publishEvent('NOTIFICATION', { userId, notification });
  }

  static async publishAnalyticsEvent(eventType: string, data: any) {
    return this.publishEvent('ANALYTICS', { eventType, data });
  }
}
