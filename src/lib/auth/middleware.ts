import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './utils';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: string;
    companyId?: string;
    email: string;
  };
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const token = req.cookies.get('auth-token')?.value || 
                   req.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const decoded = verifyToken(token);
      
      (req as AuthenticatedRequest).user = {
        id: decoded.userId,
        role: decoded.role,
        companyId: decoded.companyId || undefined, 
        email: decoded.email,
      };

      return handler(req as AuthenticatedRequest);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  };
}

export function requireRole(roles: string[]) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return requireAuth(async (req: AuthenticatedRequest) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', req.user.id);
      requestHeaders.set('x-user-role', req.user.role);
      requestHeaders.set('x-user-email', req.user.email);
      if (req.user.companyId) {
        requestHeaders.set('x-company-id', req.user.companyId);
      }
      
      const newRequest = new NextRequest(req.url, {
        method: req.method,
        headers: requestHeaders,
        body: req.body,
      });
      
      return handler(newRequest as AuthenticatedRequest);
    });
  };
}