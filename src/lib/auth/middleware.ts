import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenAsync } from './utils';

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

      const decoded = await verifyTokenAsync(token);
      
      (req as AuthenticatedRequest).user = {
        id: decoded.userId,
        role: decoded.role,
        companyId: decoded.companyId || undefined, 
        email: decoded.email,
      };

      return handler(req as AuthenticatedRequest);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  };
}

export function requireRole(roles: string[]) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
      try {
        const token = req.cookies.get('auth-token')?.value || 
                     req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const decoded = await verifyTokenAsync(token);
        
        if (!roles.includes(decoded.role)) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-user-id', decoded.userId);
        requestHeaders.set('x-user-role', decoded.role);
        requestHeaders.set('x-user-email', decoded.email);
        if (decoded.companyId) {
          requestHeaders.set('x-company-id', decoded.companyId);
        }

        const newRequest = new NextRequest(req.url, {
          method: req.method,
          headers: requestHeaders,
          body: req.body,
        });
        
        return handler(newRequest);
      } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    };
  };
}