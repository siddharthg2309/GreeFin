import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { funds, watchlist } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const items = await db
      .select({
        watchlist,
        fund: funds,
      })
      .from(watchlist)
      .innerJoin(funds, eq(watchlist.fundId, funds.id))
      .where(eq(watchlist.userId, userId))
      .orderBy(watchlist.createdAt);

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

