import { NextResponse } from 'next/server';
import { EventPublisher } from '@/lib/eventPublisher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { eventType, data } = await request.json();

    let success = false;

    switch (eventType) {
      case 'ORDER_CREATED':
        success = await EventPublisher.publishOrderCreated(data);
        break;

      case 'ORDER_STATUS_UPDATED':
        success = await EventPublisher.publishOrderStatusUpdated(data);
        break;

      case 'PRODUCT_UPDATED':
        success = await EventPublisher.publishProductUpdated(data);
        break;

      case 'NOTIFICATION':
        success = await EventPublisher.publishNotification(data.userId, data.notification);
        break;

      case 'ANALYTICS':
        success = await EventPublisher.publishAnalyticsEvent(data.eventType, data.data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to publish event' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Event API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
