import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenAsync } from '@/lib/auth/utils';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;

  console.log('Middleware called for:', pathname);
  console.log('Token exists:', !!token);

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
    console.log('Public route, allowing through');
    return NextResponse.next();
  }
  
  if (!token) {
    console.log('No token found');
    if (apiRoutes) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const decoded = await verifyTokenAsync(token);
    console.log('Token decoded successfully:', { userId: decoded.userId, role: decoded.role });
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', decoded.role);
    requestHeaders.set('x-user-email', decoded.email);
    
    if (decoded.companyId) {
      requestHeaders.set('x-company-id', decoded.companyId);
    }
    
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    if (pathname === '/') {
      console.log('Root path redirect for role:', decoded.role);
      const role = decoded.role;
      if (role === 'super_admin') {
        console.log('Redirecting super_admin to /admin');
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (role === 'agent') {
        console.log('Redirecting agent to /agent');
        return NextResponse.redirect(new URL('/agent', request.url));
      } else {
        console.log('Redirecting customer to /customer');
        return NextResponse.redirect(new URL('/customer', request.url));
      }
    }
    
    return response;
  } catch {
    console.log('Token verification failed');
    if (apiRoutes) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api/auth/login|api/auth/logout|_next/static|_next/image|favicon.ico|public).*)',
  ],
};