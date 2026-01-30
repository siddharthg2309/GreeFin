import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { funds, sips } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const userSips = await db
      .select({
        sip: sips,
        fund: {
          id: funds.id,
          name: funds.name,
          type: funds.type,
          nav: funds.nav,
          minInvestment: funds.minInvestment,
        },
      })
      .from(sips)
      .innerJoin(funds, eq(sips.fundId, funds.id))
      .where(eq(sips.userId, userId))
      .orderBy(sips.createdAt);

    return NextResponse.json({
      success: true,
      data: userSips,
    });
  } catch (error) {
    console.error('Error fetching SIPs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch SIPs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json().catch(() => null);

    const fundId = typeof body?.fundId === 'string' ? body.fundId : '';
    const installmentAmount = Number(body?.installmentAmount);
    const frequency = body?.frequency;
    const startDate = typeof body?.startDate === 'string' ? body.startDate : '';

    if (!fundId || !Number.isFinite(installmentAmount) || installmentAmount <= 0 || !frequency || !startDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const [fund] = await db.select().from(funds).where(eq(funds.id, fundId)).limit(1);
    if (!fund) {
      return NextResponse.json({ success: false, error: 'Fund not found' }, { status: 404 });
    }

    const minInvestment = Number.parseFloat(fund.minInvestment);
    if (installmentAmount < minInvestment) {
      return NextResponse.json(
        { success: false, error: `Minimum SIP amount is ₹${minInvestment}` },
        { status: 400 }
      );
    }

    if (!['WEEKLY', 'MONTHLY'].includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Frequency must be WEEKLY or MONTHLY' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid start date' }, { status: 400 });
    }

    const nextExecution = new Date(start);
    if (frequency === 'WEEKLY') {
      nextExecution.setDate(nextExecution.getDate() + 7);
    } else {
      nextExecution.setMonth(nextExecution.getMonth() + 1);
    }

    const [newSip] = await db
      .insert(sips)
      .values({
        userId,
        fundId,
        installmentAmount: installmentAmount.toString(),
        frequency: frequency as 'WEEKLY' | 'MONTHLY',
        startDate: start.toISOString().split('T')[0],
        nextExecutionDate: nextExecution.toISOString().split('T')[0],
        status: 'ACTIVE',
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        sip: newSip,
        fund: { id: fund.id, name: fund.name },
        message: `SIP created for ${fund.name}. First installment of ₹${installmentAmount} will be invested on ${startDate}.`,
      },
    });
  } catch (error) {
    console.error('Error creating SIP:', error);
    return NextResponse.json({ success: false, error: 'Failed to create SIP' }, { status: 500 });
  }
}

