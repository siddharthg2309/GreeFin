import { NextResponse } from 'next/server';
import { and, count, eq, sum } from 'drizzle-orm';

import { csrFundings, funds, greenCreditClaims, orders } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    const invitsData = await db
      .select({
        count: count(),
        totalNav: sum(funds.nav),
      })
      .from(funds)
      .where(and(eq(funds.issuerId, corporateId), eq(funds.type, 'INVIT'), eq(funds.isActive, true)));

    const bondsData = await db
      .select({
        count: count(),
        totalNav: sum(funds.nav),
      })
      .from(funds)
      .where(
        and(eq(funds.issuerId, corporateId), eq(funds.type, 'GREEN_BOND'), eq(funds.isActive, true))
      );

    const csrData = await db
      .select({
        totalAllocated: sum(csrFundings.totalAmount),
        totalRemaining: sum(csrFundings.remainingAmount),
      })
      .from(csrFundings)
      .where(eq(csrFundings.corporateId, corporateId));

    const investmentsData = await db
      .select({
        totalAmount: sum(orders.amount),
        totalOrders: count(),
      })
      .from(orders)
      .innerJoin(funds, eq(orders.fundId, funds.id))
      .where(and(eq(funds.issuerId, corporateId), eq(orders.status, 'COMPLETED')));

    const recentRedemptions = await db
      .select({
        count: count(),
        totalRedeemed: sum(greenCreditClaims.creditsRedeemed),
      })
      .from(greenCreditClaims)
      .innerJoin(csrFundings, eq(greenCreditClaims.csrFundingId, csrFundings.id))
      .where(and(eq(csrFundings.corporateId, corporateId), eq(greenCreditClaims.status, 'APPROVED')));

    const totalAllocated = Number.parseFloat(csrData[0]?.totalAllocated || '0');
    const totalRemaining = Number.parseFloat(csrData[0]?.totalRemaining || '0');

    return NextResponse.json({
      success: true,
      data: {
        invits: {
          count: Number(invitsData[0]?.count || 0),
          totalValue: Number.parseFloat(invitsData[0]?.totalNav || '0'),
        },
        bonds: {
          count: Number(bondsData[0]?.count || 0),
          totalValue: Number.parseFloat(bondsData[0]?.totalNav || '0'),
        },
        csr: {
          totalAllocated,
          totalRemaining,
          utilized: totalAllocated - totalRemaining,
        },
        investments: {
          totalAmount: Number.parseFloat(investmentsData[0]?.totalAmount || '0'),
          totalOrders: Number(investmentsData[0]?.totalOrders || 0),
        },
        redemptions: {
          count: Number(recentRedemptions[0]?.count || 0),
          totalRedeemed: Number.parseFloat(recentRedemptions[0]?.totalRedeemed || '0'),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

