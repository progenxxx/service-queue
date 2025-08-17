import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/utils';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't need authentication
  const publicRoutes = [
    '/login',
    '/login/agent', 
    '/login/superadmin'
  ];

  // API routes that don't need middleware protection
  const publicApiRoutes = [
    '/api/auth/login', 
    '/api/auth/logout'
  ];

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const isPublicApiRoute = publicApiRoutes.some(route => pathname === route);
  const isApiRoute = pathname.startsWith('/api/');

  // Allow public routes and API routes to pass through
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // For protected API routes, require authentication
  if (isApiRoute && !token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // For protected pages, redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  try {
    const decoded = verifyToken(token);

    // Set headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', decoded.role);
    requestHeaders.set('x-user-email', decoded.email);
    if (decoded.companyId) {
      requestHeaders.set('x-company-id', decoded.companyId);
    }

    // Handle root path redirect
    if (pathname === '/') {
      if (decoded.role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (decoded.role === 'agent') {
        return NextResponse.redirect(new URL('/agent', request.url));
      } else {
        return NextResponse.redirect(new URL('/customer', request.url));
      }
    }

    // Check role-based access
    if (pathname.startsWith('/admin') && decoded.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (pathname.startsWith('/agent') && decoded.role !== 'agent') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (pathname.startsWith('/customer') && !['customer', 'customer_admin'].includes(decoded.role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow the request to proceed with updated headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Invalid token - redirect to login for pages, return 401 for API
    if (isApiRoute) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};