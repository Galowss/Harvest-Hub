import { getRabbitMQChannel, QUEUES } from '@/lib/rabbitmq';
import { db } from '@/app/config/firebase';
import { doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { CacheService } from '@/lib/cacheService';

async function startOrderProcessor() {
  console.log('🚀 Starting Order Processor Worker...');

  const channel = await getRabbitMQChannel();
  
  // Assert queues exist
  await channel.assertQueue(QUEUES.ORDER_CREATED, { durable: true });
  await channel.assertQueue(QUEUES.ORDER_STATUS_UPDATED, { durable: true });
  await channel.assertQueue(QUEUES.PRODUCT_UPDATED, { durable: true });
  await channel.assertQueue(QUEUES.NOTIFICATION, { durable: true });

  // Set prefetch to 1 for fair distribution
  await channel.prefetch(1);

  // ==========================================
  // HANDLER: Order Created
  // ==========================================
  channel.consume(QUEUES.ORDER_CREATED, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());
      console.log('📦 Processing new order:', event.orderId);

      // 1. Send notification to farmer
      const farmerDoc = await getDoc(doc(db, 'users', event.farmerId));
      if (farmerDoc.exists()) {
        const farmerData = farmerDoc.data();
        console.log(`📧 Sending notification to farmer ${farmerData.email}`);
        
        // Create notification in Firestore
        await addDoc(collection(db, 'notifications'), {
          userId: event.farmerId,
          type: 'NEW_ORDER',
          title: 'New Order Received',
          message: `You have a new order worth ₱${event.total}`,
          orderId: event.orderId,
          read: false,
          createdAt: new Date()
        });
      }

      // 2. Update analytics
      await addDoc(collection(db, 'analytics_events'), {
        type: 'ORDER_CREATED',
        orderId: event.orderId,
        amount: event.total,
        timestamp: new Date(),
        userId: event.userId,
        farmerId: event.farmerId
      });

      // 3. Invalidate caches
      await CacheService.del(CacheService.ordersKey(event.userId));
      await CacheService.del(CacheService.farmerOrdersKey(event.farmerId));

      console.log('✅ Order processed successfully');
      channel.ack(msg);
    } catch (error) {
      console.error('❌ Error processing order:', error);
      // Requeue on failure (with limit)
      channel.nack(msg, false, true);
    }
  });

  // ==========================================
  // HANDLER: Order Status Updated
  // ==========================================
  channel.consume(QUEUES.ORDER_STATUS_UPDATED, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());
      console.log('📝 Processing order status update:', event.orderId);

      // Send notification to user
      await addDoc(collection(db, 'notifications'), {
        userId: event.userId,
        type: 'ORDER_STATUS_UPDATED',
        title: 'Order Status Updated',
        message: `Your order status is now: ${event.newStatus}`,
        orderId: event.orderId,
        read: false,
        createdAt: new Date()
      });

      // Invalidate order caches
      await CacheService.del(CacheService.ordersKey(event.userId));

      console.log('✅ Status update processed');
      channel.ack(msg);
    } catch (error) {
      console.error('❌ Error processing status update:', error);
      channel.nack(msg, false, true);
    }
  });

  // ==========================================
  // HANDLER: Product Updated
  // ==========================================
  channel.consume(QUEUES.PRODUCT_UPDATED, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());
      console.log('🛍️ Processing product update:', event.productId);

      // Invalidate product caches
      await CacheService.del(CacheService.productKey(event.productId));
      await CacheService.del(CacheService.farmerProductsKey(event.farmerId));
      await CacheService.invalidatePattern('products:list:*');

      // Update search index (if you implement search)
      // await updateSearchIndex(event.productId);

      console.log('✅ Product caches invalidated');
      channel.ack(msg);
    } catch (error) {
      console.error('❌ Error processing product update:', error);
      channel.nack(msg, false, true);
    }
  });

  // ==========================================
  // HANDLER: Notifications
  // ==========================================
  channel.consume(QUEUES.NOTIFICATION, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());
      console.log('🔔 Sending notification to:', event.userId);

      // Add to Firestore notifications
      await addDoc(collection(db, 'notifications'), {
        ...event.notification,
        userId: event.userId,
        read: false,
        createdAt: new Date()
      });

      // Could integrate with push notifications, email, SMS here
      
      console.log('✅ Notification sent');
      channel.ack(msg);
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      channel.nack(msg, false, true);
    }
  });

  console.log('✅ Order Processor Worker is running and listening for events...');
}

// Start the worker
startOrderProcessor().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('⚠️ Shutting down worker gracefully...');
  process.exit(0);
});
