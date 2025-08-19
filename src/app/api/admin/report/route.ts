import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export const GET = requireRole(['super_admin'])(
  async () => {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();

      const monthlyData = [];
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(currentYear, i, 1);
        const monthEnd = new Date(currentYear, i + 1, 0);
        
        const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
        
        const monthStats = await db
          .select({
            total: sql<number>`count(*)`,
            new: sql<number>`count(*) filter (where task_status = 'new')`,
            open: sql<number>`count(*) filter (where task_status = 'open')`,
            inProgress: sql<number>`count(*) filter (where task_status = 'in_progress')`,
            closed: sql<number>`count(*) filter (where task_status = 'closed')`,
          })
          .from(serviceRequests)
          .where(sql`created_at >= ${monthStart} AND created_at <= ${monthEnd}`);

        monthlyData.push({
          month: monthName,
          newTickets: monthStats[0]?.new || 0,
          wipTickets: monthStats[0]?.inProgress || 0,
          closedTickets: monthStats[0]?.closed || 0,
          totalPastDue: 0,
        });
      }

      const totalStats = await db
        .select({
          totalNewTickets: sql<number>`count(*) filter (where task_status = 'new')`,
          totalWipTickets: sql<number>`count(*) filter (where task_status in ('open', 'in_progress'))`,
          totalClosedTickets: sql<number>`count(*) filter (where task_status = 'closed')`,
          totalTasksPastDue: sql<number>`count(*) filter (where due_date < now() and task_status != 'closed')`,
        })
        .from(serviceRequests);

      const currentStats = totalStats[0] || {
        totalNewTickets: 0,
        totalWipTickets: 0,
        totalClosedTickets: 0,
        totalTasksPastDue: 0,
      };

      return NextResponse.json({
        summary: {
          totalNewTickets: currentStats.totalNewTickets,
          totalWipTickets: currentStats.totalWipTickets,
          totalClosedTickets: currentStats.totalClosedTickets,
          totalTasksPastDue: currentStats.totalTasksPastDue,
          weeklyChange: {
            newTickets: 10,
            wipTickets: 10,
            closedTickets: 8,
            pastDueTickets: 8,
          }
        },
        monthlyData,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);