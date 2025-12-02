import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cacheService';

// POST /api/cache/invalidate { pattern }
export async function POST(request: NextRequest) {
  try {
    const { pattern } = await request.json();
    
    if (!pattern) {
      return NextResponse.json({ error: 'Pattern required' }, { status: 400 });
    }

    const count = await CacheService.invalidatePattern(pattern);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Cache invalidate error:', error);
    return NextResponse.json({ success: false, count: 0 });
  }
}
