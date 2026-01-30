import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { funds } from '@/db/schema';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [fund] = await db.select().from(funds).where(eq(funds.id, id)).limit(1);

    if (!fund) {
      return NextResponse.json({ success: false, error: 'Fund not found' }, { status: 404 });
    }

    const priceHistory = generateMockPriceHistory(Number.parseFloat(fund.nav));

    return NextResponse.json({
      success: true,
      data: {
        ...fund,
        priceHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching fund:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fund' }, { status: 500 });
  }
}

function generateMockPriceHistory(currentNav: number) {
  const periods = ['3M', '6M', '1Y', '2Y', '3Y'] as const;
  const history: Record<string, { date: string; price: number }[]> = {};

  periods.forEach((period) => {
    const days =
      period === '3M'
        ? 90
        : period === '6M'
          ? 180
          : period === '1Y'
            ? 365
            : period === '2Y'
              ? 730
              : 1095;

    const volatility = 0.02;
    const points: { date: string; price: number }[] = [];

    let price = currentNav * (1 - Math.random() * 0.3);
    const step = Math.ceil(days / 30);

    for (let i = days; i >= 0; i -= step) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const drift = ((currentNav - price) / (i + 1)) * 0.5;
      price += drift + (Math.random() - 0.5) * currentNav * volatility;
      price = Math.max(price, currentNav * 0.5);

      points.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
      });
    }

    if (points.length > 0) {
      points[points.length - 1].price = currentNav;
    }

    history[period] = points;
  });

  return history;
}
