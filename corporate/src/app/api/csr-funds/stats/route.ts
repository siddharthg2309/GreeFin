import { NextResponse } from 'next/server';
import { and, count, eq, inArray, sum } from 'drizzle-orm';

import { csrFundings, greenCreditClaims } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    const allocations = await db
      .select()
      .from(csrFundings)
      .where(eq(csrFundings.corporateId, corporateId));

    const totalAllocated = allocations.reduce((acc, a) => acc + Number.parseFloat(a.totalAmount || '0'), 0);
    const totalRemaining = allocations.reduce(
      (acc, a) => acc + Number.parseFloat(a.remainingAmount || '0'),
      0
    );

    const totalUtilized = totalAllocated - totalRemaining;
    const utilizationPercent = totalAllocated > 0 ? ((totalUtilized / totalAllocated) * 100).toFixed(1) : '0.0';

    const activeCount = allocations.filter((a) => a.status === 'ACTIVE').length;
    const exhaustedCount = allocations.filter((a) => a.status === 'EXHAUSTED').length;

    let redemptionCount = 0;
    let totalCreditsRedeemed = 0;

    const allocationIds = allocations.map((a) => a.id);
    if (allocationIds.length > 0) {
      const [agg] = await db
        .select({
          redemptionCount: count(),
          totalCreditsRedeemed: sum(greenCreditClaims.creditsRedeemed),
        })
        .from(greenCreditClaims)
        .where(
          and(
            eq(greenCreditClaims.status, 'APPROVED'),
            inArray(greenCreditClaims.csrFundingId, allocationIds)
          )
        );

      redemptionCount = Number(agg?.redemptionCount || 0);
      totalCreditsRedeemed = Number.parseFloat(agg?.totalCreditsRedeemed || '0');
    }

    return NextResponse.json({
      success: true,
      data: {
        totalAllocated,
        totalRemaining,
        totalUtilized,
        utilizationPercent,
        activeCount,
        exhaustedCount,
        redemptionCount,
        totalCreditsRedeemed,
      },
    });
  } catch (error) {
    console.error('Error fetching CSR stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch CSR stats' }, { status: 500 });
  }
}

