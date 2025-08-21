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
    } catch (error) {
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
      const assignedToIdRaw = formData.get('assignedById') as string;
      const companyId = formData.get('companyId') as string;

      if (!client || !serviceRequestNarrative || !assignedToIdRaw) {
        return NextResponse.json(
          { error: 'Client, service request narrative, and assigned to are required' },
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

      let finalAssignedToId = assignedToIdRaw;

      const agentCheck = await db.query.agents.findFirst({
        where: eq(agents.id, assignedToIdRaw),
        with: {
          user: {
            columns: {
              id: true,
            },
          },
        },
      });

      if (agentCheck) {
        finalAssignedToId = agentCheck.user.id;
      } else {
        const userCheck = await db.query.users.findFirst({
          where: eq(users.id, assignedToIdRaw),
        });

        if (!userCheck) {
          return NextResponse.json(
            { error: 'Invalid assigned to user' },
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

      const newRequest = await db.insert(serviceRequests).values({
        serviceQueueId,
        client,
        companyId: finalCompanyId,
        serviceRequestNarrative,
        serviceQueueCategory: serviceQueueCategory as 'policy_inquiry' | 'claims_processing' | 'account_update' | 'technical_support' | 'billing_inquiry' | 'client_service_cancel_non_renewal' | 'other',
        assignedById: currentUserId,
        assignedToId: finalAssignedToId,
        dueDate,
        taskStatus: 'new',
      }).returning();

      if (finalAssignedToId) {
        try {
          const assignedToUser = await db.query.users.findFirst({
            where: eq(users.id, finalAssignedToId),
            columns: {
              email: true,
              firstName: true,
              lastName: true,
            },
          });

          const requestCreator = await db.query.users.findFirst({
            where: eq(users.id, currentUserId),
            columns: {
              firstName: true,
              lastName: true,
            },
          });

          if (assignedToUser) {
            await emailService.sendNewRequest(assignedToUser.email, {
              requestId: newRequest[0].id,
              serviceQueueId: newRequest[0].serviceQueueId,
              clientName: client,
              requestTitle: serviceRequestNarrative,
              category: serviceQueueCategory,
              createdBy: requestCreator ? `${requestCreator.firstName} ${requestCreator.lastName}` : 'Unknown',
              priority: dueDate ? 'High' : 'Normal',
            });
          }
        } catch (emailError) {
          console.error('Failed to send new request notification email:', emailError);
        }
      }

      const files = formData.getAll('files') as File[];
      if (files.length > 0) {
        console.log(`Processing ${files.length} file uploads...`);
      }

      return NextResponse.json({ 
        message: 'Service request created successfully',
        request: newRequest[0],
        assignedToId: finalAssignedToId
      });
    } catch (error) {
      console.error('Failed to create service request:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);