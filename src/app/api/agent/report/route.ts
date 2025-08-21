import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { serviceRequests, companies, users } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';
import { z } from 'zod';

const reportParamsSchema = z.object({
  status: z.enum(['all', 'new', 'open', 'in_progress', 'closed']).optional().default('all'),
  customerId: z.string().optional(),
  dateRange: z.enum(['all', 'today', 'week', 'month', 'quarter']).optional().default('all'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function getDateRange(range: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        start: startOfDay,
        end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'week':
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      return {
        start: startOfWeek,
        end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
      };
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: startOfMonth, end: endOfMonth };
    case 'quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      const startOfQuarter = new Date(now.getFullYear(), quarterStart, 1);
      const endOfQuarter = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59, 999);
      return { start: startOfQuarter, end: endOfQuarter };
    default:
      return null;
  }
}

function getMonthName(monthIndex: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
}

export const GET = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const params = reportParamsSchema.parse({
        status: searchParams.get('status') || 'all',
        customerId: searchParams.get('customerId') || undefined,
        dateRange: searchParams.get('dateRange') || 'all',
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      });

      // Build base where conditions
      const whereConditions = [];
      
      // Status filter
      if (params.status !== 'all') {
        whereConditions.push(eq(serviceRequests.taskStatus, params.status));
      }
      
      // Customer filter
      if (params.customerId) {
        whereConditions.push(eq(serviceRequests.companyId, params.customerId));
      }
      
      // Date range filter
      let dateFilter = null;
      if (params.startDate && params.endDate) {
        dateFilter = {
          start: new Date(params.startDate),
          end: new Date(params.endDate)
        };
      } else if (params.dateRange !== 'all') {
        dateFilter = getDateRange(params.dateRange);
      }
      
      if (dateFilter) {
        whereConditions.push(gte(serviceRequests.createdAt, dateFilter.start));
        whereConditions.push(lte(serviceRequests.createdAt, dateFilter.end));
      }

      // Get current totals
      const currentTotals = await db
        .select({
          status: serviceRequests.taskStatus,
          count: count()
        })
        .from(serviceRequests)
        .where(whereConditions.length > 0 ? and(...whereConditions.filter(c => !c.toString().includes('task_status'))) : undefined)
        .groupBy(serviceRequests.taskStatus);

      // Calculate totals
      const statusCounts = {
        new: 0,
        open: 0,
        in_progress: 0,
        closed: 0,
      };
      
      currentTotals.forEach(row => {
        if (row.status in statusCounts) {
          statusCounts[row.status as keyof typeof statusCounts] = row.count;
        }
      });

      // Get past due count (tickets with dueDate < now and not closed)
      const now = new Date();
      const pastDueResult = await db
        .select({ count: count() })
        .from(serviceRequests)
        .where(
          and(
            lte(serviceRequests.dueDate, now),
            eq(serviceRequests.taskStatus, 'open'),
            params.customerId ? eq(serviceRequests.companyId, params.customerId) : undefined
          )
        );
      
      const totalTasksPastDue = pastDueResult[0]?.count || 0;

      // Calculate weekly change (compare current week vs previous week)
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);
      
      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);
      
      const previousWeekEnd = new Date(currentWeekStart);
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
      previousWeekEnd.setHours(23, 59, 59, 999);

      // Current week counts
      const currentWeekCounts = await db
        .select({
          status: serviceRequests.taskStatus,
          count: count()
        })
        .from(serviceRequests)
        .where(
          and(
            gte(serviceRequests.createdAt, currentWeekStart),
            lte(serviceRequests.createdAt, currentWeekEnd),
            params.customerId ? eq(serviceRequests.companyId, params.customerId) : undefined
          )
        )
        .groupBy(serviceRequests.taskStatus);

      // Previous week counts
      const previousWeekCounts = await db
        .select({
          status: serviceRequests.taskStatus,
          count: count()
        })
        .from(serviceRequests)
        .where(
          and(
            gte(serviceRequests.createdAt, previousWeekStart),
            lte(serviceRequests.createdAt, previousWeekEnd),
            params.customerId ? eq(serviceRequests.companyId, params.customerId) : undefined
          )
        )
        .groupBy(serviceRequests.taskStatus);

      // Calculate percentage changes
      const currentWeekStatusCounts = { new: 0, open: 0, in_progress: 0, closed: 0 };
      const previousWeekStatusCounts = { new: 0, open: 0, in_progress: 0, closed: 0 };
      
      currentWeekCounts.forEach(row => {
        if (row.status in currentWeekStatusCounts) {
          currentWeekStatusCounts[row.status as keyof typeof currentWeekStatusCounts] = row.count;
        }
      });
      
      previousWeekCounts.forEach(row => {
        if (row.status in previousWeekStatusCounts) {
          previousWeekStatusCounts[row.status as keyof typeof previousWeekStatusCounts] = row.count;
        }
      });

      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      // Get monthly data for the last 12 months
      const monthlyData = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const monthCounts = await db
          .select({
            status: serviceRequests.taskStatus,
            count: count()
          })
          .from(serviceRequests)
          .where(
            and(
              gte(serviceRequests.createdAt, monthStart),
              lte(serviceRequests.createdAt, monthEnd),
              params.customerId ? eq(serviceRequests.companyId, params.customerId) : undefined
            )
          )
          .groupBy(serviceRequests.taskStatus);
        
        const monthStatusCounts = { new: 0, open: 0, in_progress: 0, closed: 0 };
        monthCounts.forEach(row => {
          if (row.status in monthStatusCounts) {
            monthStatusCounts[row.status as keyof typeof monthStatusCounts] = row.count;
          }
        });
        
        // Get past due for this month
        const monthPastDue = await db
          .select({ count: count() })
          .from(serviceRequests)
          .where(
            and(
              gte(serviceRequests.createdAt, monthStart),
              lte(serviceRequests.createdAt, monthEnd),
              lte(serviceRequests.dueDate, monthEnd),
              eq(serviceRequests.taskStatus, 'open'),
              params.customerId ? eq(serviceRequests.companyId, params.customerId) : undefined
            )
          );
        
        monthlyData.push({
          month: getMonthName(monthStart.getMonth()),
          newTickets: monthStatusCounts.new,
          wipTickets: monthStatusCounts.in_progress + monthStatusCounts.open, // Combine open + in_progress for "WIP"
          closedTickets: monthStatusCounts.closed,
          totalPastDue: monthPastDue[0]?.count || 0,
        });
      }

      const response = {
        summary: {
          totalNewTickets: statusCounts.new,
          totalWipTickets: statusCounts.open + statusCounts.in_progress, // Combine for "WIP"
          totalClosedTickets: statusCounts.closed,
          totalTasksPastDue,
          weeklyChange: {
            newTickets: calculatePercentageChange(currentWeekStatusCounts.new, previousWeekStatusCounts.new),
            wipTickets: calculatePercentageChange(
              currentWeekStatusCounts.open + currentWeekStatusCounts.in_progress,
              previousWeekStatusCounts.open + previousWeekStatusCounts.in_progress
            ),
            closedTickets: calculatePercentageChange(currentWeekStatusCounts.closed, previousWeekStatusCounts.closed),
            pastDueTickets: calculatePercentageChange(
              currentWeekStatusCounts.open,
              previousWeekStatusCounts.open
            ),
          }
        },
        monthlyData,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Reports API error:', error);
      
      return NextResponse.json(
        { error: 'Failed to generate reports' },
        { status: 500 }
      );
    }
  }
);