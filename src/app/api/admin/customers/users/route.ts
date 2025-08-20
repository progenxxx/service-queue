import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { users, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { generateLoginCode } from '@/lib/auth/utils-node';
import { emailService } from '@/lib/email/sendgrid';
import { notificationService } from '@/lib/services/notification';

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
      const currentUserId = req.headers.get('x-user-id');

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, validatedData.email),
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }

      // Generate login code
      const loginCode = generateLoginCode();

      // Create new user
      const [newUser] = await db.insert(users).values({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        loginCode: loginCode,
        role: validatedData.role,
        companyId: validatedData.customerId,
        isActive: true,
      }).returning();

      // Send welcome email and notification (non-blocking)
      try {
        const company = await db.query.companies.findFirst({
          where: eq(companies.id, validatedData.customerId),
        });

        if (company) {
          await emailService.sendCustomerWelcome(newUser.email, {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            loginCode: loginCode,
            companyName: company.companyName,
          });
        }

        if (currentUserId) {
          await notificationService.notifyUserCreated(currentUserId, {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            companyId: validatedData.customerId,
          });
        }
      } catch (emailError) {
        console.error('Failed to send welcome email or create notification:', emailError);
        // Continue execution - don't fail the user creation for email issues
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
      console.error('Error in POST /api/admin/customers/users:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      // Check for database constraint errors
      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
          return NextResponse.json(
            { error: 'A user with this email already exists' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to create user. Please try again.' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      console.log('DELETE request received');
      
      // Parse request body
      let body;
      try {
        body = await req.json();
        console.log('Request body:', body);
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }

      // Validate request data
      let validatedData;
      try {
        validatedData = deleteUserSchema.parse(body);
        console.log('Validated data:', validatedData);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        if (validationError instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: validationError.issues },
            { status: 400 }
          );
        }
        throw validationError;
      }

      const { userId, customerId } = validatedData;

      // Check if user exists and belongs to the specified customer
      let existingUser;
      try {
        existingUser = await db.query.users.findFirst({
          where: and(
            eq(users.id, userId),
            eq(users.companyId, customerId)
          ),
        });
        console.log('Existing user found:', existingUser ? 'Yes' : 'No');
      } catch (dbError) {
        console.error('Database query error:', dbError);
        return NextResponse.json(
          { error: 'Database error while searching for user' },
          { status: 500 }
        );
      }

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found or does not belong to this customer' },
          { status: 404 }
        );
      }

      // Delete the user
      try {
        await db.delete(users).where(eq(users.id, userId));
        console.log('User deleted successfully');
      } catch (deleteError) {
        console.error('Database delete error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete user from database' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: `User "${existingUser.firstName} ${existingUser.lastName}" has been deleted successfully.` 
      });
    } catch (error) {
      console.error('Unexpected error in DELETE /api/admin/customers/users:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return NextResponse.json(
        { 
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
  }
);