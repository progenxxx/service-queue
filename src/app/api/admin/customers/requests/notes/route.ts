import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { requestNotes, serviceRequests, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { emailService } from '@/lib/email/sendgrid';

const createNoteSchema = z.object({
  noteContent: z.string().min(1, 'Note content is required'),
  recipientEmail: z.string().email('Valid email address is required'),
  requestId: z.string().optional(),
});

export const POST = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const userId = req.headers.get('x-user-id');
      
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      const body = await req.json();
      const validatedData = createNoteSchema.parse(body);

      let requestData = null;
      
      if (validatedData.requestId) {
        requestData = await db.query.serviceRequests.findFirst({
          where: eq(serviceRequests.id, validatedData.requestId),
          with: {
            company: {
              columns: {
                companyName: true,
              },
            },
          },
        });

        if (requestData) {
          await db.insert(requestNotes).values({
            requestId: validatedData.requestId,
            authorId: userId,
            noteContent: validatedData.noteContent,
            isInternal: false,
          });
        }
      }

      const noteAuthor = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          firstName: true,
          lastName: true,
        },
      });

      try {
        await emailService.sendNoteAdded(validatedData.recipientEmail, {
          requestId: requestData?.id || 'N/A',
          serviceQueueId: requestData?.serviceQueueId || 'N/A',
          noteContent: validatedData.noteContent,
          authorName: noteAuthor ? `${noteAuthor.firstName} ${noteAuthor.lastName}` : 'Unknown',
          clientName: requestData?.client || 'N/A',
          requestTitle: requestData?.serviceRequestNarrative || 'N/A',
        });
      } catch (emailError) {
        console.error('Failed to send note notification email:', emailError);
        return NextResponse.json({ 
          error: 'Note saved but email notification failed' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Note added and email sent successfully'
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