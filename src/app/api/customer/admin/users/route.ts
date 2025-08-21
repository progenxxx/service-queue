import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { users, companies } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';
import { emailService } from '@/lib/email/sendgrid';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  loginCode: z.string().min(7, 'Login code must be at least 7 characters'),
});

const updateUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  loginCode: z.string().min(7, 'Login code must be at least 7 characters'),
});

const deleteUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const GET = requireRole(['customer_admin'])(async (req: NextRequest) => {
  try {
    const userCompanyId = req.headers.get('x-company-id');
    const currentUserId = req.headers.get('x-user-id');

    if (!userCompanyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const companyUsers = await db.query.users.findMany({
      where: and(
        eq(users.companyId, userCompanyId),
        eq(users.isActive, true),
        eq(users.role, 'customer'),
        ne(users.id, currentUserId)
      ),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        loginCode: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return NextResponse.json({ users: companyUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = requireRole(['customer_admin'])(async (req: NextRequest) => {
  try {
    const userCompanyId = req.headers.get('x-company-id');

    if (!userCompanyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

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

    const existingCode = await db.query.users.findFirst({
      where: eq(users.loginCode, validatedData.loginCode),
    });
    if (existingCode) {
      return NextResponse.json(
        { error: 'This login code is already in use' },
        { status: 400 }
      );
    }

    const [newUser] = await db
      .insert(users)
      .values({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        loginCode: validatedData.loginCode,
        role: 'customer',
        companyId: userCompanyId,
        isActive: true,
      })
      .returning();

    try {
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, userCompanyId),
      });

      if (company) {
        await emailService.sendCustomerWelcome(newUser.email, {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          loginCode: validatedData.loginCode,
          companyName: company.companyName,
        });
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
        loginCode: newUser.loginCode,
        isActive: newUser.isActive,
      },
      message: `User "${newUser.firstName} ${newUser.lastName}" created successfully with login code: ${validatedData.loginCode}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = requireRole(['customer_admin'])(async (req: NextRequest) => {
  try {
    const userCompanyId = req.headers.get('x-company-id');
    if (!userCompanyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, validatedData.userId),
        eq(users.companyId, userCompanyId),
        eq(users.role, 'customer')
      ),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found or does not belong to your company' },
        { status: 404 }
      );
    }

    if (validatedData.email !== existingUser.email) {
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, validatedData.email),
      });
      if (existingEmail && existingEmail.id !== existingUser.id) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }
    }

    if (validatedData.loginCode !== existingUser.loginCode) {
      const existingCode = await db.query.users.findFirst({
        where: eq(users.loginCode, validatedData.loginCode),
      });
      if (existingCode && existingCode.id !== existingUser.id) {
        return NextResponse.json(
          { error: 'This login code is already in use' },
          { status: 400 }
        );
      }
    }

    await db
      .update(users)
      .set({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        loginCode: validatedData.loginCode,
        updatedAt: new Date(),
      })
      .where(eq(users.id, validatedData.userId));

    return NextResponse.json({
      success: true,
      message: `User "${validatedData.firstName} ${validatedData.lastName}" updated successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = requireRole(['customer_admin'])(async (req: NextRequest) => {
  try {
    const userCompanyId = req.headers.get('x-company-id');
    const currentUserId = req.headers.get('x-user-id');

    if (!userCompanyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = deleteUserSchema.parse(body);

    if (validatedData.userId === currentUserId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, validatedData.userId),
        eq(users.companyId, userCompanyId),
        eq(users.role, 'customer')
      ),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found or does not belong to your company' },
        { status: 404 }
      );
    }

    await db.delete(users).where(eq(users.id, validatedData.userId));

    return NextResponse.json({
      success: true,
      message: `User "${existingUser.firstName} ${existingUser.lastName}" deleted successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
