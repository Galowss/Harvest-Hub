import { getRabbitMQChannel, QUEUES } from './rabbitmq';

export class EventPublisher {
  static async publish(queue: string, message: any): Promise<boolean> {
    // Only run on server-side
    if (typeof window !== 'undefined') {
      console.warn('EventPublisher can only be used on server-side');
      return false;
    }
    
    try {
      const channel = await getRabbitMQChannel();
      
      // Ensure queue exists
      await channel.assertQueue(queue, {
        durable: true, // Survive broker restarts
        maxLength: 10000 // Prevent unbounded growth
      });

      // Publish message
      const sent = channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true, // Survive broker restarts
          timestamp: Date.now()
        }
      );

      if (!sent) {
        console.warn(`Queue ${queue} is full, message buffered`);
      }

      return sent;
    } catch (error) {
      console.error(`Failed to publish to queue ${queue}:`, error);
      return false;
    }
  }

  // Specific event publishers
  static async publishOrderCreated(orderData: any) {
    return this.publish(QUEUES.ORDER_CREATED, {
      type: 'ORDER_CREATED',
      orderId: orderData.id,
      userId: orderData.userId,
      farmerId: orderData.farmerId,
      total: orderData.totalPrice,
      timestamp: new Date().toISOString(),
      data: orderData
    });
  }

  static async publishOrderStatusUpdated(data: { orderId: string; status: string; buyerId: string; farmerId: string }) {
    return this.publish(QUEUES.ORDER_STATUS_UPDATED, {
      type: 'ORDER_STATUS_UPDATED',
      orderId: data.orderId,
      newStatus: data.status,
      userId: data.buyerId,
      farmerId: data.farmerId,
      timestamp: new Date().toISOString()
    });
  }

  static async publishProductUpdated(data: { productId: string; farmerId: string; action: string; productName: string; stock: number }) {
    return this.publish(QUEUES.PRODUCT_UPDATED, {
      type: 'PRODUCT_UPDATED',
      productId: data.productId,
      farmerId: data.farmerId,
      action: data.action,
      productName: data.productName,
      stock: data.stock,
      timestamp: new Date().toISOString()
    });
  }

  static async publishNotification(userId: string, notification: any) {
    return this.publish(QUEUES.NOTIFICATION, {
      type: 'NOTIFICATION',
      userId,
      notification,
      timestamp: new Date().toISOString()
    });
  }

  static async publishAnalyticsEvent(eventType: string, data: any) {
    return this.publish(QUEUES.ANALYTICS, {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }
}
