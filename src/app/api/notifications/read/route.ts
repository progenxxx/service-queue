import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';

export const POST = requireRole(['super_admin', 'customer_admin', 'customer', 'agent'])(
  async (req: NextRequest) => {
    try {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const notificationId = pathParts[pathParts.indexOf('notifications') + 1];

      if (!notificationId) {
        return NextResponse.json(
          { error: 'Notification ID is required' },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: `Notification ${notificationId} marked as read`
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);