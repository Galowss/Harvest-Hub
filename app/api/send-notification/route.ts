// API route placeholder - email notifications disabled
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    { success: false, message: 'Email notifications are currently disabled' },
    { status: 501 }
  );
}
