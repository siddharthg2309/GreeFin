import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { funds } from '@/db/schema';
import { db } from '@/lib/db';

type FundType = 'GREEN_BOND' | 'INVIT' | 'GREEN_FUND';

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;

    const validTypes: FundType[] = ['GREEN_BOND', 'INVIT', 'GREEN_FUND'];
    if (!validTypes.includes(type as FundType)) {
      return NextResponse.json({ success: false, error: 'Invalid fund type' }, { status: 400 });
    }

    const results = await db
      .select()
      .from(funds)
      .where(and(eq(funds.isActive, true), eq(funds.type, type as FundType)))
      .orderBy(funds.name);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching funds by type:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch funds' }, { status: 500 });
  }
}
