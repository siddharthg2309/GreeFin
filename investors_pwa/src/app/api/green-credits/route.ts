import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { users } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const [user] = await db
      .select({
        greenCredits: users.greenCredits,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: Number.parseFloat(user.greenCredits || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching green credits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch green credits' },
      { status: 500 }
    );
  }
}

