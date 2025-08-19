import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET = requireRole(['customer', 'customer_admin', 'agent'])(
  async (req: NextRequest) => {
    try {
      const companyId = req.headers.get('x-company-id');
      const userRole = req.headers.get('x-user-role');
      const url = new URL(req.url);
      const requestId = url.searchParams.get('id');
      
      if (!requestId) {
        return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
      }

      if (!companyId && userRole !== 'agent') {
        return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
      }

      let whereClause;
      if (userRole === 'agent') {
        whereClause = eq(serviceRequests.id, requestId);
      } else {
        whereClause = and(
          eq(serviceRequests.id, requestId),
          eq(serviceRequests.companyId, companyId!)
        );
      }

      const request = await db.query.serviceRequests.findFirst({
        where: whereClause,
        with: {
          assignedTo: {
            columns: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedBy: {
            columns: {
              firstName: true,
              lastName: true,
            },
          },
          company: {
            columns: {
              companyName: true,
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
      });

      if (!request) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      return NextResponse.json({ request });
    } catch (error) {
      console.error('Failed to fetch request detail:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);