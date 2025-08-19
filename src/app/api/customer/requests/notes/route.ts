import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { requestNotes, serviceRequests, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { emailService } from '@/lib/email/sendgrid';

const createNoteSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required').optional(),
  noteContent: z.string().min(1, 'Note content is required'),
  isInternal: z.boolean().optional().default(false),
  recipientEmail: z.string().email('Valid email address is required').optional(),
});

export const GET = requireRole(['customer', 'customer_admin', 'agent', 'super_admin'])(
  async (req: NextRequest) => {
    try {
      const userId = req.headers.get('x-user-id');
      const companyId = req.headers.get('x-company-id');
      const userRole = req.headers.get('x-user-role');
      const url = new URL(req.url);
      const requestId = url.searchParams.get('requestId');
      
      if (!requestId) {
        return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
      }

      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      let whereClause;
      if (userRole === 'agent' || userRole === 'super_admin') {
        whereClause = eq(serviceRequests.id, requestId);
      } else {
        if (!companyId) {
          return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }
        whereClause = and(
          eq(serviceRequests.id, requestId),
          eq(serviceRequests.companyId, companyId)
        );
      }

      const request = await db.query.serviceRequests.findFirst({
        where: whereClause,
      });

      if (!request) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      const notes = await db.query.requestNotes.findMany({
        where: eq(requestNotes.requestId, requestId),
        with: {
          author: {
            columns: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [desc(requestNotes.createdAt)],
      });

      return NextResponse.json({ notes });
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = requireRole(['customer', 'customer_admin', 'agent', 'super_admin'])(
  async (req: NextRequest) => {
    try {
      const userId = req.headers.get('x-user-id');
      const companyId = req.headers.get('x-company-id');
      const userRole = req.headers.get('x-user-role');
      
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      const body = await req.json();
      const validatedData = createNoteSchema.parse(body);

      if (validatedData.recipientEmail && !validatedData.requestId) {
        const noteAuthor = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            firstName: true,
            lastName: true,
          },
        });

        try {
          await emailService.sendNoteAdded(validatedData.recipientEmail, {
            requestId: 'N/A',
            serviceQueueId: 'N/A',
            noteContent: validatedData.noteContent,
            authorName: noteAuthor ? `${noteAuthor.firstName} ${noteAuthor.lastName}` : 'Unknown',
            clientName: 'N/A',
            requestTitle: 'Direct Note',
          });

          return NextResponse.json({ 
            success: true, 
            message: 'Email sent successfully'
          });
        } catch (emailError) {
          console.error('Failed to send note email:', emailError);
          return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }
      }

      if (!validatedData.requestId) {
        return NextResponse.json({ error: 'Request ID is required for note creation' }, { status: 400 });
      }

      let whereClause;
      if (userRole === 'agent' || userRole === 'super_admin') {
        whereClause = eq(serviceRequests.id, validatedData.requestId);
      } else {
        if (!companyId) {
          return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }
        whereClause = and(
          eq(serviceRequests.id, validatedData.requestId),
          eq(serviceRequests.companyId, companyId)
        );
      }

      const request = await db.query.serviceRequests.findFirst({
        where: whereClause,
        with: {
          assignedTo: {
            columns: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedBy: {
            columns: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          company: {
            columns: {
              companyName: true,
            },
          },
        },
      });

      if (!request) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      const [newNote] = await db.insert(requestNotes).values({
        requestId: validatedData.requestId,
        authorId: userId,
        noteContent: validatedData.noteContent,
        isInternal: validatedData.isInternal,
      }).returning();

      const noteAuthor = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      const emailPromises = [];

      if (request.assignedTo && request.assignedTo.email && request.assignedTo.email !== noteAuthor?.email) {
        emailPromises.push(
          emailService.sendNoteAdded(request.assignedTo.email, {
            requestId: request.id,
            serviceQueueId: request.serviceQueueId,
            noteContent: validatedData.noteContent,
            authorName: noteAuthor ? `${noteAuthor.firstName} ${noteAuthor.lastName}` : 'Unknown',
            clientName: request.client,
            requestTitle: request.serviceRequestNarrative,
          })
        );
      }

      if (request.assignedBy && 
          request.assignedBy.email && 
          request.assignedBy.email !== noteAuthor?.email &&
          request.assignedBy.email !== request.assignedTo?.email) {
        emailPromises.push(
          emailService.sendNoteAdded(request.assignedBy.email, {
            requestId: request.id,
            serviceQueueId: request.serviceQueueId,
            noteContent: validatedData.noteContent,
            authorName: noteAuthor ? `${noteAuthor.firstName} ${noteAuthor.lastName}` : 'Unknown',
            clientName: request.client,
            requestTitle: request.serviceRequestNarrative,
          })
        );
      }

      if (emailPromises.length > 0) {
        try {
          await Promise.all(emailPromises);
        } catch (emailError) {
          console.error('Failed to send note notification emails:', emailError);
        }
      }

      const noteWithAuthor = {
        ...newNote,
        author: noteAuthor ? {
          firstName: noteAuthor.firstName,
          lastName: noteAuthor.lastName,
          email: noteAuthor.email,
        } : null,
      };

      return NextResponse.json({ 
        success: true, 
        note: noteWithAuthor,
        message: 'Note added successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to create note:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);