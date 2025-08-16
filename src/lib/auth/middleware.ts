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
    } catch {
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
      return handler(req);
    });
  };
}