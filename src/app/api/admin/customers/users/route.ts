import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const deleteUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
});

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