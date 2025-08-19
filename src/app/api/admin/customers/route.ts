import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { companies, serviceRequests, users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export const GET = requireRole(['super_admin'])(
  async () => {
    try {
      const customers = await db
        .select({
          id: companies.id,
          companyName: companies.companyName,
          companyCode: companies.companyCode,
          primaryContact: companies.primaryContact,
          email: companies.email,
          phone: companies.phone,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
          openTickets: sql<number>`coalesce((
            select count(*) 
            from ${serviceRequests} 
            where ${serviceRequests.companyId} = ${companies.id} 
            and ${serviceRequests.taskStatus} in ('new', 'open')
          ), 0)`,
          wipTickets: sql<number>`coalesce((
            select count(*) 
            from ${serviceRequests} 
            where ${serviceRequests.companyId} = ${companies.id} 
            and ${serviceRequests.taskStatus} = 'in_progress'
          ), 0)`,
          closedTickets: sql<number>`coalesce((
            select count(*) 
            from ${serviceRequests} 
            where ${serviceRequests.companyId} = ${companies.id} 
            and ${serviceRequests.taskStatus} = 'closed'
          ), 0)`,
          totalTickets: sql<number>`coalesce((
            select count(*) 
            from ${serviceRequests} 
            where ${serviceRequests.companyId} = ${companies.id}
          ), 0)`,
          activeUsers: sql<number>`coalesce((
            select count(*) 
            from ${users} 
            where ${users.companyId} = ${companies.id} 
            and ${users.isActive} = true
          ), 0)`,
          totalUsers: sql<number>`coalesce((
            select count(*) 
            from ${users} 
            where ${users.companyId} = ${companies.id}
          ), 0)`,
          lastRequestDate: sql<string>`(
            select to_char(max(${serviceRequests.createdAt}), 'MM/DD/YYYY HH12:MI AM')
            from ${serviceRequests} 
            where ${serviceRequests.companyId} = ${companies.id}
          )`,
          modifiedBy: companies.primaryContact,
          modifiedOn: sql<string>`to_char(${companies.updatedAt}, 'MM/DD/YYYY HH12:MI AM')`,
        })
        .from(companies)
        .orderBy(companies.companyName);

      // Calculate additional metrics for each customer
      const customersWithMetrics = customers.map(customer => {
        const totalTickets = customer.totalTickets;
        const completionRate = totalTickets > 0 
          ? Math.round((customer.closedTickets / totalTickets) * 100) 
          : 0;
        
        const activeTickets = customer.openTickets + customer.wipTickets;
        const hasRecentActivity = customer.lastRequestDate !== null;
        
        // Determine customer status based on activity
        let status = 'inactive';
        if (hasRecentActivity) {
          const lastRequest = new Date(customer.lastRequestDate || '');
          const daysSinceLastRequest = Math.floor(
            (Date.now() - lastRequest.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastRequest <= 7) {
            status = 'very_active';
          } else if (daysSinceLastRequest <= 30) {
            status = 'active';
          } else if (daysSinceLastRequest <= 90) {
            status = 'moderate';
          } else {
            status = 'low_activity';
          }
        }

        return {
          ...customer,
          completionRate,
          activeTickets,
          hasRecentActivity,
          status,
          daysSinceLastActivity: customer.lastRequestDate 
            ? Math.floor((Date.now() - new Date(customer.lastRequestDate).getTime()) / (1000 * 60 * 60 * 24))
            : null
        };
      });

      // Calculate summary statistics
      const summary = {
        totalCustomers: customers.length,
        activeCustomers: customersWithMetrics.filter(c => c.status === 'very_active' || c.status === 'active').length,
        totalTickets: customers.reduce((sum, c) => sum + c.totalTickets, 0),
        totalOpenTickets: customers.reduce((sum, c) => sum + c.openTickets, 0),
        totalWipTickets: customers.reduce((sum, c) => sum + c.wipTickets, 0),
        totalClosedTickets: customers.reduce((sum, c) => sum + c.closedTickets, 0),
        totalUsers: customers.reduce((sum, c) => sum + c.totalUsers, 0),
        totalActiveUsers: customers.reduce((sum, c) => sum + c.activeUsers, 0),
        averageCompletionRate: customers.length > 0 
          ? Math.round(customersWithMetrics.reduce((sum, c) => sum + c.completionRate, 0) / customers.length)
          : 0
      };

      return NextResponse.json({ 
        customers: customersWithMetrics,
        summary 
      });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

// Optional: Add a specific customer details endpoint
export const HEAD = requireRole(['super_admin'])(
  async () => {
    try {
      // Just return count for quick health check
      const customerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(companies);

      return new NextResponse(null, {
        status: 200,
        headers: {
          'X-Total-Customers': customerCount[0]?.count?.toString() || '0'
        }
      });
    } catch (error) {
      console.error('Failed to fetch customer count:', error);
      return new NextResponse(null, { status: 500 });
    }
  }
);