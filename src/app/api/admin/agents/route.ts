import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { users, agents, companies } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { generateLoginCode } from '@/lib/auth/utils-node';
import { emailService } from '@/lib/email/sendgrid';

const createAgentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  assignedCompanyIds: z.array(z.string()).optional().default([]),
});

type CompanyData = {
  id: string;
  companyName: string;
};

export const GET = requireRole(['super_admin'])(
  async () => {
    try {
      const agentsWithDetails = await db.query.agents.findMany({
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              loginCode: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
        orderBy: (agents, { desc }) => [desc(agents.createdAt)],
      });

      const agentsWithCompanies = await Promise.all(
        agentsWithDetails.map(async (agent) => {
          let assignedCompanies: CompanyData[] = [];
          
          if (agent.assignedCompanyIds && agent.assignedCompanyIds.length > 0) {
            assignedCompanies = await db.query.companies.findMany({
              where: inArray(companies.id, agent.assignedCompanyIds),
              columns: {
                id: true,
                companyName: true,
              },
            });
          }

          return {
            id: agent.id,
            firstName: agent.user.firstName,
            lastName: agent.user.lastName,
            email: agent.user.email,
            loginCode: agent.user.loginCode,
            assignedCompanyIds: agent.assignedCompanyIds || [],
            isActive: agent.user.isActive,
            createdAt: agent.user.createdAt,
            assignedCompanies,
          };
        })
      );

      return NextResponse.json({ agents: agentsWithCompanies });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = createAgentSchema.parse(body);

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, validatedData.email),
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }

      const loginCode = generateLoginCode();

      const [newUser] = await db.insert(users).values({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        loginCode,
        role: 'agent',
        isActive: true,
      }).returning();

      const [newAgent] = await db.insert(agents).values({
        userId: newUser.id,
        assignedCompanyIds: validatedData.assignedCompanyIds,
        isActive: true,
      }).returning();

      try {
        await emailService.sendAgentWelcome(newUser.email, {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          loginCode,
          companyName: 'Service Queue Platform',
        });
      } catch {
        // Email sending failed but agent creation succeeded
      }

      return NextResponse.json({ 
        success: true, 
        agent: {
          id: newAgent.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          loginCode: newUser.loginCode,
          assignedCompanyIds: newAgent.assignedCompanyIds || [],
          isActive: newUser.isActive,
          createdAt: newUser.createdAt,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);