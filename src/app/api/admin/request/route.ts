import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests, companies, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

// Function to generate Service Queue ID in the format ServQUE-1234567891234
function generateServiceQueueId(): string {
  const prefix = 'ServQUE';
  const timestamp = Date.now().toString();
  return `${prefix}-${timestamp}`;
}

export const GET = requireRole(['super_admin'])(
  async () => {
    try {
      const requests = await db.query.serviceRequests.findMany({
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
          },
        },
        orderBy: [desc(serviceRequests.createdAt)],
      });

      return NextResponse.json({ requests });
    } catch (error) {
      console.error('Failed to fetch all requests:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = requireRole(['super_admin', 'customer_admin', 'customer'])(
  async (request: NextRequest) => {
    try {
      const formData = await request.formData();
      
      // Extract form fields
      const client = formData.get('client') as string;
      const serviceRequestNarrative = formData.get('serviceRequestNarrative') as string;
      const serviceQueueCategory = formData.get('serviceQueueCategory') as string;
      const dueDateStr = formData.get('dueDate') as string;
      const serviceQueueId = formData.get('serviceQueueId') as string || generateServiceQueueId();
      const assignedById = formData.get('assignedById') as string;
      const companyId = formData.get('companyId') as string;

      // Validate required fields
      if (!client || !serviceRequestNarrative || !companyId) {
        return NextResponse.json(
          { error: 'Client, service request narrative, and company are required' },
          { status: 400 }
        );
      }

      // Convert due date string to Date object if provided
      const dueDate = dueDateStr ? new Date(dueDateStr) : null;

      // Get current user from headers (set by middleware)
      const currentUserId = request.headers.get('x-user-id');
      const currentUserRole = request.headers.get('x-user-role');
      const currentUserCompanyId = request.headers.get('x-company-id');

      if (!currentUserId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Use the provided assignedById or fall back to current user
      const finalAssignedById = assignedById || currentUserId;

      // For customers, use their company ID, for super_admin allow any company
      let finalCompanyId = companyId;
      if (currentUserRole !== 'super_admin' && currentUserCompanyId) {
        finalCompanyId = currentUserCompanyId;
      }

      // Find the primary contact user by joining companies and users
      // companies.company_code = users.login_code
      let assignedToId = null;
      
      try {
        // Get the selected company's company_code
        const selectedCompany = await db.query.companies.findFirst({
          where: eq(companies.id, finalCompanyId),
          columns: {
            companyCode: true,
          },
        });

        if (selectedCompany?.companyCode) {
          // Find the user with matching login_code
          const primaryContactUser = await db.query.users.findFirst({
            where: eq(users.loginCode, selectedCompany.companyCode),
            columns: {
              id: true,
            },
          });

          if (primaryContactUser) {
            assignedToId = primaryContactUser.id;
          }
        }
      } catch (error) {
        console.error('Error finding primary contact user:', error);
        // Continue without assignedToId if there's an error
      }

      // Create the service request
      const newRequest = await db.insert(serviceRequests).values({
        serviceQueueId,
        client,
        companyId: finalCompanyId,
        serviceRequestNarrative,
        serviceQueueCategory: serviceQueueCategory as 'policy_inquiry' | 'claims_processing' | 'account_update' | 'technical_support' | 'billing_inquiry' | 'other',
        assignedById: finalAssignedById,
        assignedToId, // This will be the primary contact user's ID or null
        dueDate,
        taskStatus: 'new',
      }).returning();

      // Handle file uploads if any
      const files = formData.getAll('files') as File[];
      if (files.length > 0) {
        // Process file uploads here
        // This would typically involve uploading to cloud storage
        // and saving file metadata to the database
        console.log(`Processing ${files.length} file uploads...`);
        
        // TODO: Implement file upload logic
        // 1. Upload files to storage (AWS S3, etc.)
        // 2. Save file metadata to requestAttachments table
      }

      return NextResponse.json({ 
        message: 'Service request created successfully',
        request: newRequest[0],
        assignedToId: assignedToId ? assignedToId : 'No primary contact found'
      });
    } catch (error) {
      console.error('Failed to create service request:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);