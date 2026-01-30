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

    const enrichedHoldings = userHoldings.map(({ holding, fund }) => {
      const quantity = Number.parseFloat(holding.quantity);
      const avgBuyPrice = Number.parseFloat(holding.avgBuyPrice);
      const currentNav = Number.parseFloat(fund.nav);
      const investedAmount = Number.parseFloat(holding.investedAmount);

      const currentValue = quantity * currentNav;
      const pnl = currentValue - investedAmount;
      const pnlPercent = investedAmount > 0 ? (pnl / investedAmount) * 100 : 0;

      return {
        id: holding.id,
        fund: {
          id: fund.id,
          name: fund.name,
          type: fund.type,
          nav: fund.nav,
        },
        quantity: quantity.toFixed(4),
        avgBuyPrice: avgBuyPrice.toFixed(4),
        investedAmount: investedAmount.toFixed(2),
        currentValue: currentValue.toFixed(2),
        pnl: pnl.toFixed(2),
        pnlPercent: pnlPercent.toFixed(2),
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedHoldings,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

