import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword, generateTokenAsync } from '@/lib/auth/utils-node';
import { z } from 'zod';

const loginSchema = z.object({
  loginCode: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
}).refine(
  (data) => (data.loginCode) || (data.email && data.password) || (data.email && data.loginCode),
  { message: "Either loginCode, email+password, or email+loginCode is required" }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    let user;

    if (validatedData.loginCode && !validatedData.email) {
      user = await db.query.users.findFirst({
        where: and(
          eq(users.loginCode, validatedData.loginCode),
          eq(users.isActive, true)
        ),
        with: {
          company: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid login code' },
          { status: 401 }
        );
      }
    } else if (validatedData.email && validatedData.password) {
      user = await db.query.users.findFirst({
        where: and(
          eq(users.email, validatedData.email),
          eq(users.isActive, true)
        ),
        with: {
          company: true,
        },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    } else if (validatedData.email && validatedData.loginCode) {
      user = await db.query.users.findFirst({
        where: and(
          eq(users.email, validatedData.email),
          eq(users.loginCode, validatedData.loginCode),
          eq(users.isActive, true)
        ),
        with: {
          company: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or login code' },
          { status: 401 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || null,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const token = await generateTokenAsync(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}