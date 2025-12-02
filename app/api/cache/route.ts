import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cacheService';

// GET /api/cache?key=xxx
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    const data = await CacheService.get(key);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Cache GET error:', error);
    return NextResponse.json({ data: null });
  }
}

// POST /api/cache { key, value, ttl }
export async function POST(request: NextRequest) {
  try {
    const { key, value, ttl } = await request.json();
    
    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
    }

    await CacheService.set(key, value, ttl);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cache SET error:', error);
    return NextResponse.json({ success: false });
  }
}

// DELETE /api/cache?key=xxx
export async function DELETE(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key required' }, { status: 400 });
    }

    await CacheService.del(key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cache DELETE error:', error);
    return NextResponse.json({ success: false });
  }
}
