import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

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