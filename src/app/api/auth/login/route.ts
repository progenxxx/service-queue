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

    // Case 1: Only loginCode provided (regular customer login)
    if (validatedData.loginCode && !validatedData.email && !validatedData.password) {
      console.log('Login attempt with code only:', validatedData.loginCode);
      
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
        console.log('No user found for login code:', validatedData.loginCode);
        return NextResponse.json(
          { error: 'Invalid login code' },
          { status: 401 }
        );
      }
    } 
    // Case 2: Email and password provided (super admin login)
    else if (validatedData.email && validatedData.password && !validatedData.loginCode) {
      console.log('Login attempt with email/password:', validatedData.email);
      
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
        console.log('No user found or no password hash for email:', validatedData.email);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        console.log('Invalid password for email:', validatedData.email);
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    } 
    // Case 3: Email and loginCode provided (customer admin login)
    else if (validatedData.email && validatedData.loginCode && !validatedData.password) {
      console.log('Login attempt with email/code:', validatedData.email, validatedData.loginCode);
      
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
        console.log('No user found for email/code combination:', validatedData.email, validatedData.loginCode);
        
        // Debug: Check if user exists with just email
        const userByEmail = await db.query.users.findFirst({
          where: eq(users.email, validatedData.email),
        });
        
        // Debug: Check if user exists with just loginCode  
        const userByCode = await db.query.users.findFirst({
          where: eq(users.loginCode, validatedData.loginCode),
        });
        
        console.log('User by email exists:', !!userByEmail, userByEmail?.role, userByEmail?.isActive);
        console.log('User by code exists:', !!userByCode, userByCode?.role, userByCode?.isActive);
        
        return NextResponse.json(
          { error: 'Invalid email or login code' },
          { status: 401 }
        );
      }
    }

    if (!user) {
      console.log('Authentication failed - no valid authentication method');
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    console.log('User authenticated successfully:', user.email, user.role);

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
    console.error('Login error:', error);
    
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