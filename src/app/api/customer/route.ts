import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests, companies, users, requestNotes, agents } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { emailService } from '@/lib/email/sendgrid';

function generateServiceQueueId(): string {
  const prefix = 'ServQUE';
  const timestamp = Date.now().toString();
  return `${prefix}-${timestamp}`;
}

export const GET = requireRole(['super_admin'])(
  async () => {
    try {
      const notes = await db.query.requestNotes.findMany({
        with: {
          author: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          request: {
            with: {
              company: {
                columns: {
                  companyName: true,
                },
              },
            },
          },
        },
        orderBy: [desc(requestNotes.createdAt)],
      });

      return NextResponse.json({ notes });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = requireRole(['super_admin', 'customer_admin', 'customer'])(
  async (request: NextRequest) => {
    try {
      const formData = await request.formData();
      
      const client = formData.get('client') as string;
      const serviceRequestNarrative = formData.get('serviceRequestNarrative') as string;
      const serviceQueueCategory = formData.get('serviceQueueCategory') as string;
      const dueDateStr = formData.get('dueDate') as string;
      const serviceQueueId = formData.get('serviceQueueId') as string || generateServiceQueueId();
      const assignedByIdRaw = formData.get('assignedById') as string;
      const companyId = formData.get('companyId') as string;

      if (!client || !serviceRequestNarrative || !assignedByIdRaw) {
        return NextResponse.json(
          { error: 'Client, service request narrative, and assigned by are required' },
          { status: 400 }
        );
      }

      const currentUserId = request.headers.get('x-user-id');
      const currentUserRole = request.headers.get('x-user-role');
      const currentUserCompanyId = request.headers.get('x-company-id');

      if (!currentUserId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      let finalAssignedById = assignedByIdRaw;

      const agentCheck = await db.query.agents.findFirst({
        where: eq(agents.id, assignedByIdRaw),
        with: {
          user: {
            columns: {
              id: true,
            },
          },
        },
      });

      if (agentCheck) {
        finalAssignedById = agentCheck.user.id;
      } else {
        const userCheck = await db.query.users.findFirst({
          where: eq(users.id, assignedByIdRaw),
        });

        if (!userCheck) {
          return NextResponse.json(
            { error: 'Invalid assigned by user' },
            { status: 400 }
          );
        }
      }

      let finalCompanyId = companyId;
      if (currentUserRole !== 'super_admin' && currentUserCompanyId) {
        finalCompanyId = currentUserCompanyId;
      }

      if (!finalCompanyId) {
        return NextResponse.json(
          { error: 'Company selection is required' },
          { status: 400 }
        );
      }

      const dueDate = dueDateStr ? new Date(dueDateStr) : null;

      let assignedToId = null;
      let primaryContactEmail = null;
      
      try {
        const result = await db
          .select({
            userId: users.id,
            userEmail: users.email,
            userFirstName: users.firstName,
            userLastName: users.lastName,
            companyName: companies.companyName,
          })
          .from(companies)
          .leftJoin(users, eq(companies.companyCode, users.loginCode))
          .where(eq(companies.id, finalCompanyId))
          .limit(1);

        if (result.length > 0 && result[0].userId) {
          assignedToId = result[0].userId;
          primaryContactEmail = result[0].userEmail;
        }
      } catch {}

      const newRequest = await db.insert(serviceRequests).values({
        serviceQueueId,
        client,
        companyId: finalCompanyId,
        serviceRequestNarrative,
        serviceQueueCategory: serviceQueueCategory as 'policy_inquiry' | 'claims_processing' | 'account_update' | 'technical_support' | 'billing_inquiry' | 'other',
        assignedById: finalAssignedById,
        assignedToId,
        dueDate,
        taskStatus: 'new',
      }).returning();

      if (primaryContactEmail && assignedToId) {
        try {
          const requestCreator = await db.query.users.findFirst({
            where: eq(users.id, finalAssignedById),
            columns: {
              firstName: true,
              lastName: true,
            },
          });

          await emailService.sendNewRequest(primaryContactEmail, {
            requestId: newRequest[0].id,
            serviceQueueId: newRequest[0].serviceQueueId,
            clientName: client,
            requestTitle: serviceRequestNarrative,
            category: serviceQueueCategory,
            createdBy: requestCreator ? `${requestCreator.firstName} ${requestCreator.lastName}` : 'Unknown',
            priority: dueDate ? 'High' : 'Normal',
          });
        } catch {}
      }

      const files = formData.getAll('files') as File[];
      if (files.length > 0) {
      }

      return NextResponse.json({ 
        message: 'Service request created successfully',
        request: newRequest[0],
        assignedToId: assignedToId ? assignedToId : 'No primary contact found'
      });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
