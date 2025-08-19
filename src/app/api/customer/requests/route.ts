import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests, requestAttachments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { generateServiceQueueId } from '@/lib/auth/utils-node';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const createRequestSchema = z.object({
  client: z.string().min(1, 'Client name is required'),
  serviceRequestNarrative: z.string().min(1, 'Service request narrative is required'),
  serviceQueueCategory: z.enum(['policy_inquiry', 'claims_processing', 'account_update', 'technical_support', 'billing_inquiry', 'other']),
  dueDate: z.string().optional(),
});

export const GET = requireRole(['customer', 'customer_admin'])(
  async (req: NextRequest) => {
    try {
      const companyId = req.headers.get('x-company-id');
      
      if (!companyId) {
        return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
      }

      const requests = await db.query.serviceRequests.findMany({
        where: eq(serviceRequests.companyId, companyId),
        with: {
          assignedTo: {
            columns: {
              firstName: true,
              lastName: true,
            },
          },
          assignedBy: {
            columns: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [desc(serviceRequests.createdAt)],
      });

      return NextResponse.json({ requests });
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = requireRole(['customer', 'customer_admin'])(
  async (req: NextRequest) => {
    try {
      const companyId = req.headers.get('x-company-id');
      const userId = req.headers.get('x-user-id');
      
      if (!companyId || !userId) {
        return NextResponse.json({ error: 'Company ID and User ID required' }, { status: 400 });
      }

      const formData = await req.formData();
      
      const requestData = {
        client: formData.get('client') as string,
        serviceRequestNarrative: formData.get('serviceRequestNarrative') as string,
        serviceQueueCategory: formData.get('serviceQueueCategory') as string,
        dueDate: formData.get('dueDate') as string || undefined,
      };

      const validatedData = createRequestSchema.parse(requestData);

      const serviceQueueId = generateServiceQueueId();

      const [newRequest] = await db.insert(serviceRequests).values({
        serviceQueueId,
        client: validatedData.client,
        companyId,
        serviceRequestNarrative: validatedData.serviceRequestNarrative,
        serviceQueueCategory: validatedData.serviceQueueCategory as any,
        assignedById: userId,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        taskStatus: 'new',
      }).returning();

      const files = formData.getAll('files') as File[];
      
      if (files.length > 0) {
        const uploadDir = join(process.cwd(), 'uploads', newRequest.id);
        
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        for (const file of files) {
          if (file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = join(uploadDir, fileName);
            
            await writeFile(filePath, buffer);
            
            await db.insert(requestAttachments).values({
              requestId: newRequest.id,
              fileName: file.name,
              filePath: `/uploads/${newRequest.id}/${fileName}`,
              fileSize: file.size,
              mimeType: file.type,
              uploadedById: userId,
            });
          }
        }
      }

      return NextResponse.json({ 
        success: true, 
        request: {
          ...newRequest,
          serviceQueueId,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to create request:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);