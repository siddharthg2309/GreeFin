import { NextResponse } from 'next/server';
import { and, eq, sum } from 'drizzle-orm';

import { funds, orders } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    const investmentData = await db
      .select({
        totalAmount: sum(orders.amount),
      })
      .from(orders)
      .innerJoin(funds, eq(orders.fundId, funds.id))
      .where(and(eq(funds.issuerId, corporateId), eq(orders.status, 'COMPLETED')));

    const totalInvestment = Number.parseFloat(investmentData[0]?.totalAmount || '0');

    const co2Avoided = totalInvestment * 0.0001;
    const cleanEnergyGenerated = totalInvestment * 0.0005;
    const treesEquivalent = Math.floor(totalInvestment / 50000);
    const homesPowered = Math.floor(cleanEnergyGenerated / 300);

    return NextResponse.json({
      success: true,
      data: {
        co2Avoided: Math.round(co2Avoided * 100) / 100,
        cleanEnergyGenerated: Math.round(cleanEnergyGenerated * 100) / 100,
        treesEquivalent,
        homesPowered,
        totalInvestment,
        sdgAlignment: {
          sdg7: 85,
          sdg9: 78,
          sdg13: 72,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching impact metrics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch impact metrics' }, { status: 500 });
  }
}

