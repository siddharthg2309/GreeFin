import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { funds, orders } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId();
    const { id } = await params;

    const [order] = await db
      .select({
        order: orders,
        fund: funds,
      })
      .from(orders)
      .innerJoin(funds, eq(orders.fundId, funds.id))
      .where(and(eq(orders.id, id), eq(orders.userId, userId)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}

