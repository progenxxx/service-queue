import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/utils';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;

  const publicRoutes = [
    '/login',
    '/login/agent', 
    '/login/superadmin',
    '/api/auth/login', 
    '/api/auth/logout'
  ];
  const apiRoutes = pathname.startsWith('/api/');

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!token) {
    if (apiRoutes) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decoded = verifyToken(token);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', decoded.role);
    requestHeaders.set('x-user-email', decoded.email);
    if (decoded.companyId) {
      requestHeaders.set('x-company-id', decoded.companyId);
    }

    if (pathname === '/') {
      const role = decoded.role;
      if (role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (role === 'agent') {
        return NextResponse.redirect(new URL('/agent', request.url));
      } else {
        return NextResponse.redirect(new URL('/customer', request.url));
      }
    }

    if (pathname.startsWith('/admin')) {
      if (decoded.role !== 'super_admin') {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    } else if (pathname.startsWith('/agent')) {
      if (decoded.role !== 'agent') {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    } else if (pathname.startsWith('/customer')) {
      if (!['customer', 'customer_admin'].includes(decoded.role)) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    const response = apiRoutes 
      ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    
    if (!apiRoutes) {
      response.cookies.delete('auth-token');
    }
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};