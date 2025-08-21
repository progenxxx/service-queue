import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests, agents } from '@/lib/db/schema';
import { desc, eq, inArray, or } from 'drizzle-orm';

export const GET = requireRole(['agent'])(async (req) => {
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

    let whereConditions;
    if (agent.assignedCompanyIds && agent.assignedCompanyIds.length > 0) {
      whereConditions = or(
        inArray(serviceRequests.companyId, agent.assignedCompanyIds),
        eq(serviceRequests.assignedToId, userId)
      );
    } else {
      whereConditions = eq(serviceRequests.assignedToId, userId);
    }

    const requests = await db.query.serviceRequests.findMany({
      where: whereConditions,
      with: {
        company: {
          columns: {
            id: true,
            companyName: true,
          },
        },
        assignedTo: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        notes: {
          with: {
            author: {
              columns: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: (notes, { desc }) => [desc(notes.createdAt)],
          limit: 5,
        },
        attachments: {
          with: {
            uploadedBy: {
              columns: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
          limit: 5,
        },
      },
      orderBy: [desc(serviceRequests.createdAt)],
    });

    const summary = {
      totalRequests: requests.length,
      newRequests: requests.filter(r => r.taskStatus === 'new').length,
      openRequests: requests.filter(r => r.taskStatus === 'open').length,
      inProgressRequests: requests.filter(r => r.taskStatus === 'in_progress').length,
      closedRequests: requests.filter(r => r.taskStatus === 'closed').length,
      overdueRequests: requests.filter(r => 
        r.dueDate && new Date(r.dueDate) < new Date() && r.taskStatus !== 'closed'
      ).length,
    };

    return NextResponse.json({ 
      requests,
      summary 
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
