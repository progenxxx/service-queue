import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { users, agents } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const GET = requireRole(['customer', 'customer_admin'])(
  async (req) => {
    try {
      const userCompanyId = req.headers.get('x-company-id');
      
      if (!userCompanyId) {
        return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
      }

      const agentsAssignedToCompany = await db.query.agents.findMany({
        where: sql`${agents.assignedCompanyIds} @> ARRAY[${userCompanyId}]`,
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      const assignableAgents = agentsAssignedToCompany
        .filter(agent => agent.user.isActive && agent.isActive)
        .map(agent => ({
          id: agent.id, 
          firstName: agent.user.firstName,
          lastName: agent.user.lastName,
          email: agent.user.email,
          role: agent.user.role,
          isActive: agent.user.isActive,
          type: 'agent'
        }));

      return NextResponse.json({ agents: assignableAgents });
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);