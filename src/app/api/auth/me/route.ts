import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenAsync } from '@/lib/auth/utils-node';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyTokenAsync(token);
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
      with: {
        company: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}