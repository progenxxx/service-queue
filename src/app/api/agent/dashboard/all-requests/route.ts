import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests, agents } from '@/lib/db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';

export const GET = requireRole(['agent'])(
  async (req: NextRequest) => {
    try {
      const userId = req.headers.get('x-user-id');
      
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      const agent = await db.query.agents.findFirst({
        where: eq(agents.userId, userId),
      });

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      let whereClause;
      if (agent.assignedCompanyIds && agent.assignedCompanyIds.length > 0) {
        whereClause = inArray(serviceRequests.companyId, agent.assignedCompanyIds);
      } else {
        whereClause = undefined;
      }

      const requests = await db.query.serviceRequests.findMany({
        where: whereClause,
        with: {
          assignedBy: true,
          company: true,
        },
        orderBy: [desc(serviceRequests.createdAt)],
        limit: 20,
      });

      return NextResponse.json({ requests });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);