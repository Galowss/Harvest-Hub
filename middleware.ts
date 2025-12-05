import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/dashboard/user',
  '/dashboard/farmer',
  '/dashboard/admin',
  '/dashboard/community',
  '/dashboard/map',
];

// Define public routes
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/products',
];

// Define role-based access control
const roleBasedRoutes: Record<string, string[]> = {
  user: ['/dashboard/user', '/dashboard/community', '/dashboard/map'],
  farmer: ['/dashboard/farmer', '/dashboard/community', '/dashboard/map'],
  admin: ['/dashboard/admin', '/dashboard/community', '/dashboard/map'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // TEMPORARILY DISABLED - Firebase Auth doesn't use cookies by default
  // The app handles auth client-side with Firebase
  // TODO: Implement proper Firebase auth token validation in middleware

  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

// Helper function to determine dashboard URL based on role
function getDashboardByRole(role?: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'farmer':
      return '/dashboard/farmer';
    case 'user':
      return '/dashboard/user';
    default:
      return '/dashboard/user';
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
