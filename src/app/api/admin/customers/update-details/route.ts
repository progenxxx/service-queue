import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { companies, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { emailService } from '@/lib/email/sendgrid';

const updateDetailsSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  companyName: z.string().min(1, 'Company name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  loginCode: z.string().min(7, 'Login code must be at least 7 characters'),
  role: z.enum(['customer', 'customer_admin', 'agent']),
});

export const POST = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      console.log('Starting update-details API call');
      
      const body = await req.json();
      console.log('Request body:', body);
      
      const validatedData = updateDetailsSchema.parse(body);
      console.log('Validated data:', validatedData);

      const existingCompany = await db.query.companies.findFirst({
        where: eq(companies.id, validatedData.customerId),
      });

      if (!existingCompany) {
        console.log('Company not found:', validatedData.customerId);
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      console.log('Found company:', existingCompany);

      const existingUser = await db.query.users.findFirst({
        where: eq(users.companyId, validatedData.customerId),
      });

      console.log('Found existing user:', existingUser);

      const result = await db.transaction(async (tx) => {
        await tx.update(companies)
          .set({
            companyName: validatedData.companyName,
            primaryContact: `${validatedData.firstName} ${validatedData.lastName}`,
            email: validatedData.email,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, validatedData.customerId));

        let userResult;
        
        if (existingUser) {
          userResult = await tx.update(users)
            .set({
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              email: validatedData.email,
              loginCode: validatedData.loginCode,
              role: validatedData.role,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id))
            .returning();

          console.log('Updated existing user');
        } else {
          userResult = await tx.insert(users).values({
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            loginCode: validatedData.loginCode,
            role: validatedData.role,
            companyId: validatedData.customerId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();

          console.log('Created new user');
        }

        return { existingUser: !!existingUser, userResult };
      });

      try {
        if (result.existingUser) {
          await emailService.sendPasswordReset(validatedData.email, {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            resetToken: validatedData.loginCode,
            expirationTime: 'Never expires',
          });
          console.log('Sent password reset email');
        } else {
          if (validatedData.role === 'customer_admin') {
            await emailService.sendCustomerAdminWelcome(validatedData.email, {
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              email: validatedData.email,
              loginCode: validatedData.loginCode,
              companyName: validatedData.companyName,
            });
            console.log('Sent customer admin welcome email');
          } else {
            await emailService.sendCustomerWelcome(validatedData.email, {
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              loginCode: validatedData.loginCode,
              companyName: validatedData.companyName,
            });
            console.log('Sent customer welcome email');
          }
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      console.log('Update completed successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Customer details updated successfully'
      });

    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof z.ZodError) {
        console.log('Validation error:', error.issues);
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json(
          { 
            error: 'Internal server error',
            ...(isDev && { 
              message: error.message,
              stack: error.stack 
            })
          }, 
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Unknown error occurred' }, 
        { status: 500 }
      );
    }
  }
);