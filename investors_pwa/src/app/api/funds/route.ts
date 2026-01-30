import { NextResponse } from 'next/server';
import { and, eq, ilike } from 'drizzle-orm';

import { funds } from '@/db/schema';
import { db } from '@/lib/db';

type FundType = 'GREEN_BOND' | 'INVIT' | 'GREEN_FUND';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // GREEN_BOND | INVIT | GREEN_FUND
    const search = searchParams.get('q');
    const minInvestment = searchParams.get('minInvestment');

    const conditions = [eq(funds.isActive, true)];

    const validTypes: FundType[] = ['GREEN_BOND', 'INVIT', 'GREEN_FUND'];
    if (type && validTypes.includes(type as FundType)) {
      conditions.push(eq(funds.type, type as FundType));
    }

    if (search) {
      conditions.push(ilike(funds.name, `%${search}%`));
    }

    const result = await db
      .select()
      .from(funds)
      .where(and(...conditions))
      .orderBy(funds.name);

    let filteredResult = result;
    if (minInvestment) {
      const maxMin = Number.parseFloat(minInvestment);
      filteredResult = result.filter((fund) => Number.parseFloat(fund.minInvestment) <= maxMin);
    }

    return NextResponse.json({
      success: true,
      data: filteredResult,
      count: filteredResult.length,
    });
  } catch (error) {
    console.error('Error fetching funds:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch funds' }, { status: 500 });
  }
}
