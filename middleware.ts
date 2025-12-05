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
  
  // Get authentication token from cookies
  const authToken = request.cookies.get('authToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from login/signup to their dashboard
  if ((pathname === '/login' || pathname === '/signup') && authToken) {
    const dashboardUrl = getDashboardByRole(userRole);
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // Role-based access control
  if (isProtectedRoute && authToken && userRole) {
    const allowedRoutes = roleBasedRoutes[userRole] || [];
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
    
    if (!hasAccess && !pathname.startsWith('/dashboard/community') && !pathname.startsWith('/dashboard/map')) {
      // Redirect to appropriate dashboard if accessing unauthorized route
      const dashboardUrl = getDashboardByRole(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

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
