import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { sips } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

type SipStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const status = body?.status as SipStatus | undefined;

    if (!status || !['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const [existingSip] = await db.select().from(sips).where(and(eq(sips.id, id), eq(sips.userId, userId))).limit(1);

    if (!existingSip) {
      return NextResponse.json({ success: false, error: 'SIP not found' }, { status: 404 });
    }

    const [updatedSip] = await db
      .update(sips)
      .set({ status })
      .where(eq(sips.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedSip,
      message: `SIP ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Error updating SIP:', error);
    return NextResponse.json({ success: false, error: 'Failed to update SIP' }, { status: 500 });
  }
}

