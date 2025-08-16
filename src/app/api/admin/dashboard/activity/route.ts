import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests, users } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

export const GET = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const recentRequests = await db.query.serviceRequests.findMany({
        with: {
          assignedBy: true,
          company: true,
        },
        orderBy: [desc(serviceRequests.createdAt)],
        limit: 10,
      });

      const activities = recentRequests.map((request) => ({
        id: request.id,
        type: 'request_created',
        description: `New service request created for ${request.client}`,
        timestamp: request.createdAt,
        user: request.assignedBy,
        company: request.company,
      }));

      return NextResponse.json({ activities });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);