let amqplib: any = null;

// Lazy load amqplib only on server-side
if (typeof window === 'undefined') {
  try {
    amqplib = require('amqplib');
  } catch (e) {
    console.warn('amqplib not available');
  }
}

type Connection = any;
type Channel = any;

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function getRabbitMQChannel(): Promise<Channel> {
  if (!amqplib) {
    throw new Error('RabbitMQ is only available on server-side');
  }
  
  if (!connection) {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqplib.connect(rabbitmqUrl);

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    console.log('RabbitMQ: Connected');
  }

  if (!channel) {
    channel = await connection.createChannel();
    console.log('RabbitMQ: Channel created');
  }

  return channel;
}

export async function closeRabbitMQ() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (error) {
    console.error('Error closing RabbitMQ:', error);
  } finally {
    channel = null;
    connection = null;
  }
}

// Queue names
export const QUEUES = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status.updated',
  PRODUCT_UPDATED: 'product.updated',
  NOTIFICATION: 'notification',
  IMAGE_PROCESSING: 'image.processing',
  ANALYTICS: 'analytics.events'
};
