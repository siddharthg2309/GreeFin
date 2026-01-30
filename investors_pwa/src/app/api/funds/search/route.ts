import { NextResponse } from 'next/server';
import { and, eq, ilike } from 'drizzle-orm';

import { funds } from '@/db/schema';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Search query must be at least 2 characters',
      });
    }

    const results = await db
      .select({
        id: funds.id,
        name: funds.name,
        type: funds.type,
        nav: funds.nav,
        minInvestment: funds.minInvestment,
        fixedReturn: funds.fixedReturn,
        cagr1y: funds.cagr1y,
      })
      .from(funds)
      .where(and(eq(funds.isActive, true), ilike(funds.name, `%${query}%`)))
      .limit(20);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching funds:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}

