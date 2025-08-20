import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { users, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { generateLoginCode } from '@/lib/auth/utils-node';
import { emailService } from '@/lib/email/sendgrid';

const deleteUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
});

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['customer', 'customer_admin']).default('customer'),
  customerId: z.string().min(1, 'Customer ID is required'),
});

export const POST = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = createUserSchema.parse(body);

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, validatedData.email),
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }

      const loginCode = generateLoginCode();

      const [newUser] = await db.insert(users).values({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        loginCode: loginCode,
        role: validatedData.role,
        companyId: validatedData.customerId,
        isActive: true,
      }).returning();

      try {
        const company = await db.query.companies.findFirst({
          where: eq(companies.id, validatedData.customerId),
        });

        if (company) {
          if (validatedData.role === 'customer_admin') {
            await emailService.sendCustomerAdminWelcome(newUser.email, {
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              email: newUser.email,
              loginCode: loginCode,
              companyName: company.companyName,
            });
          } else {
            await emailService.sendCustomerWelcome(newUser.email, {
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              loginCode: loginCode,
              companyName: company.companyName,
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      return NextResponse.json({ 
        success: true,
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          loginCode: newUser.loginCode,
          isActive: newUser.isActive,
        },
        message: `User "${newUser.firstName} ${newUser.lastName}" has been created successfully with login code ${loginCode}.`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to create user:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const DELETE = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = deleteUserSchema.parse(body);
      const { userId, customerId } = validatedData;

      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          eq(users.companyId, customerId)
        ),
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found or does not belong to this customer' },
          { status: 404 }
        );
      }

      await db.delete(users).where(eq(users.id, userId));

      return NextResponse.json({ 
        success: true, 
        message: `User "${existingUser.firstName} ${existingUser.lastName}" has been deleted successfully.` 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to delete user:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);