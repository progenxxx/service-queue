import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

export const GET = requireRole(['super_admin'])(
  async () => {
    try {
      const allCompanies = await db.query.companies.findMany({
        columns: {
          id: true,
          companyName: true,
        },
        orderBy: (companies, { asc }) => [asc(companies.companyName)],
      });

      return NextResponse.json({ companies: allCompanies });
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);