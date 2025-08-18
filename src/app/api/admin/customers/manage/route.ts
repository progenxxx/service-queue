import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { companies, users, serviceRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  primaryContact: z.string().min(1, 'Primary contact is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

const deleteCustomerSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});

export const GET = requireRole(['super_admin'])(
  async () => {
    try {
      const customersWithUsers = await db.query.companies.findMany({
        with: {
          users: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
        orderBy: (companies, { asc }) => [asc(companies.companyName)],
      });

      return NextResponse.json({ customers: customersWithUsers });
    } catch (error) {
      console.error('Failed to fetch customers for management:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = createCustomerSchema.parse(body);

      const existingCompany = await db.query.companies.findFirst({
        where: eq(companies.email, validatedData.email),
      });

      if (existingCompany) {
        return NextResponse.json(
          { error: 'A company with this email already exists' },
          { status: 400 }
        );
      }

      const [newCompany] = await db.insert(companies).values({
        companyName: validatedData.companyName,
        primaryContact: validatedData.primaryContact,
        phone: validatedData.phone || '',
        email: validatedData.email,
      }).returning();

      const customerWithUsers = await db.query.companies.findFirst({
        where: eq(companies.id, newCompany.id),
        with: {
          users: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        customer: customerWithUsers 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to create customer:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const DELETE = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = deleteCustomerSchema.parse(body);
      const customerId = validatedData.customerId;

      const existingCustomer = await db.query.companies.findFirst({
        where: eq(companies.id, customerId),
      });

      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      const hasActiveRequests = await db.query.serviceRequests.findFirst({
        where: eq(serviceRequests.companyId, customerId),
      });

      if (hasActiveRequests) {
        return NextResponse.json(
          { error: 'Cannot delete customer with active service requests' },
          { status: 400 }
        );
      }

      await db.delete(users).where(eq(users.companyId, customerId));
      await db.delete(companies).where(eq(companies.id, customerId));

      return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to delete customer:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);