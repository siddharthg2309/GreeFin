import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { watchlist } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

export async function DELETE(request: Request, { params }: { params: Promise<{ fundId: string }> }) {
  try {
    const userId = getCurrentUserId();
    const { fundId } = await params;

    const result = await db
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.fundId, fundId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Fund not in watchlist' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}

