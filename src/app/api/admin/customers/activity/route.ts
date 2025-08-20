// src/app/api/admin/customers/activity/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests, requestNotes, requestAttachments, users, companies } from '@/lib/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';

interface ActivityItem {
  id: string;
  type: 'ticket_created' | 'ticket_updated' | 'note_added' | 'attachment_uploaded';
  message: string;
  createdBy: string;
  createdAt: string;
  userInitials: string;
}

export const GET = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const customerId = searchParams.get('customerId');

      if (!customerId) {
        return NextResponse.json(
          { error: 'Customer ID is required' },
          { status: 400 }
        );
      }

      // Verify the customer exists
      const customer = await db.query.companies.findFirst({
        where: eq(companies.id, customerId),
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Get recent service requests activity
      const recentRequests = await db
        .select({
          id: serviceRequests.id,
          type: sql<string>`'ticket_created'`,
          message: sql<string>`'Created new service request: ' || ${serviceRequests.serviceRequestNarrative}`,
          createdBy: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
          createdAt: serviceRequests.createdAt,
          userInitials: sql<string>`UPPER(LEFT(${users.firstName}, 1) || LEFT(${users.lastName}, 1))`,
        })
        .from(serviceRequests)
        .leftJoin(users, eq(serviceRequests.assignedById, users.id))
        .where(eq(serviceRequests.companyId, customerId))
        .orderBy(desc(serviceRequests.createdAt))
        .limit(10);

      // Get recent notes activity
      const recentNotes = await db
        .select({
          id: requestNotes.id,
          type: sql<string>`'note_added'`,
          message: sql<string>`'Added note: ' || LEFT(${requestNotes.noteContent}, 100) || CASE WHEN LENGTH(${requestNotes.noteContent}) > 100 THEN '...' ELSE '' END`,
          createdBy: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
          createdAt: requestNotes.createdAt,
          userInitials: sql<string>`UPPER(LEFT(${users.firstName}, 1) || LEFT(${users.lastName}, 1))`,
        })
        .from(requestNotes)
        .leftJoin(serviceRequests, eq(requestNotes.requestId, serviceRequests.id))
        .leftJoin(users, eq(requestNotes.authorId, users.id))
        .where(eq(serviceRequests.companyId, customerId))
        .orderBy(desc(requestNotes.createdAt))
        .limit(10);

      // Get recent attachment activity
      const recentAttachments = await db
        .select({
          id: requestAttachments.id,
          type: sql<string>`'attachment_uploaded'`,
          message: sql<string>`'Uploaded attachment: ' || ${requestAttachments.fileName}`,
          createdBy: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
          createdAt: requestAttachments.createdAt,
          userInitials: sql<string>`UPPER(LEFT(${users.firstName}, 1) || LEFT(${users.lastName}, 1))`,
        })
        .from(requestAttachments)
        .leftJoin(serviceRequests, eq(requestAttachments.requestId, serviceRequests.id))
        .leftJoin(users, eq(requestAttachments.uploadedById, users.id))
        .where(eq(serviceRequests.companyId, customerId))
        .orderBy(desc(requestAttachments.createdAt))
        .limit(10);

      // Get recent ticket updates (status changes)
      const recentUpdates = await db
        .select({
          id: serviceRequests.id,
          type: sql<string>`'ticket_updated'`,
          message: sql<string>`'Updated ticket status to ' || ${serviceRequests.taskStatus}`,
          createdBy: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, 'System')`,
          createdAt: serviceRequests.updatedAt,
          userInitials: sql<string>`COALESCE(UPPER(LEFT(${users.firstName}, 1) || LEFT(${users.lastName}, 1)), 'SY')`,
        })
        .from(serviceRequests)
        .leftJoin(users, eq(serviceRequests.modifiedById, users.id))
        .where(
          and(
            eq(serviceRequests.companyId, customerId),
            sql`${serviceRequests.updatedAt} > ${serviceRequests.createdAt}`
          )
        )
        .orderBy(desc(serviceRequests.updatedAt))
        .limit(10);

      // Combine all activities and sort by date
      const allActivities = [
        ...recentRequests,
        ...recentNotes,
        ...recentAttachments,
        ...recentUpdates,
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 15); // Get top 15 most recent activities

      // Format the activities
      const formattedActivities: ActivityItem[] = allActivities.map((activity) => ({
        id: activity.id,
        type: activity.type as ActivityItem['type'],
        message: activity.message,
        createdBy: activity.createdBy || 'Unknown User',
        createdAt: new Date(activity.createdAt).toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        userInitials: activity.userInitials || 'UN',
      }));

      return NextResponse.json({
        success: true,
        activities: formattedActivities,
        customer: {
          id: customer.id,
          companyName: customer.companyName,
        },
      });
    } catch (error) {
      console.error('Failed to fetch customer activity:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);