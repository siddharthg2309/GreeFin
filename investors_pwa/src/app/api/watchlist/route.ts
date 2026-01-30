import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { funds, watchlist } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const userWatchlist = await db
      .select({
        id: watchlist.id,
        createdAt: watchlist.createdAt,
        fund: funds,
      })
      .from(watchlist)
      .innerJoin(funds, eq(watchlist.fundId, funds.id))
      .where(eq(watchlist.userId, userId))
      .orderBy(watchlist.createdAt);

    return NextResponse.json({
      success: true,
      data: userWatchlist,
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json().catch(() => null);
    const fundId = typeof body?.fundId === 'string' ? body.fundId : '';

    if (!fundId) {
      return NextResponse.json({ success: false, error: 'Fund ID required' }, { status: 400 });
    }

    const [fund] = await db.select().from(funds).where(eq(funds.id, fundId)).limit(1);
    if (!fund) {
      return NextResponse.json({ success: false, error: 'Fund not found' }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.fundId, fundId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ success: false, error: 'Fund already in watchlist' }, { status: 400 });
    }

    const [newEntry] = await db.insert(watchlist).values({ userId, fundId }).returning();

    return NextResponse.json({
      success: true,
      data: newEntry,
      message: `${fund.name} added to watchlist`,
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to add to watchlist' }, { status: 500 });
  }
}
