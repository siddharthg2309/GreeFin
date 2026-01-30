import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { funds, holdings } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const userHoldings = await db
      .select({
        holding: holdings,
        fund: funds,
      })
      .from(holdings)
      .innerJoin(funds, eq(holdings.fundId, funds.id))
      .where(eq(holdings.userId, userId));

    if (userHoldings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalInvested: 0,
          currentValue: 0,
          totalPnl: 0,
          pnlPercent: 0,
          xirr: 0,
        },
      });
    }

    let totalInvested = 0;
    let currentValue = 0;

    userHoldings.forEach(({ holding, fund }) => {
      const invested = Number.parseFloat(holding.investedAmount);
      const current = Number.parseFloat(holding.quantity) * Number.parseFloat(fund.nav);

      totalInvested += invested;
      currentValue += current;
    });

    const totalPnl = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    const xirr = pnlPercent * 1.2;

    return NextResponse.json({
      success: true,
      data: {
        totalInvested: Math.round(totalInvested * 100) / 100,
        currentValue: Math.round(currentValue * 100) / 100,
        totalPnl: Math.round(totalPnl * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        xirr: Math.round(xirr * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

