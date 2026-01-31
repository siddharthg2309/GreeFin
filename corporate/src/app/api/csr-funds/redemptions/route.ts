import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

import { csrFundings, greenCreditClaims, users } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    const redemptions = await db
      .select({
        id: greenCreditClaims.id,
        userId: greenCreditClaims.userId,
        userName: users.name,
        userEmail: users.email,
        productName: greenCreditClaims.productName,
        productPrice: greenCreditClaims.productPrice,
        creditsRedeemed: greenCreditClaims.creditsRedeemed,
        csrFundingId: greenCreditClaims.csrFundingId,
        status: greenCreditClaims.status,
        createdAt: greenCreditClaims.createdAt,
        processedAt: greenCreditClaims.processedAt,
      })
      .from(greenCreditClaims)
      .innerJoin(csrFundings, eq(greenCreditClaims.csrFundingId, csrFundings.id))
      .innerJoin(users, eq(greenCreditClaims.userId, users.id))
      .where(eq(csrFundings.corporateId, corporateId))
      .orderBy(desc(greenCreditClaims.createdAt));

    return NextResponse.json({ success: true, data: redemptions });
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch redemptions' }, { status: 500 });
  }
}

