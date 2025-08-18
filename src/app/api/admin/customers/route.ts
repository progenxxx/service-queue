import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { companies, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  primaryContact: z.string().min(1, 'Primary contact is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address'),
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
      console.error('Failed to fetch customers:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = createCustomerSchema.parse(body);

      // Check if company with same email already exists
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

      return NextResponse.json({ 
        success: true, 
        customer: newCompany 
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