import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

import { csrFundings } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

type CreatePayload = {
  totalAmount?: unknown;
  description?: unknown;
};

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    const allocations = await db
      .select()
      .from(csrFundings)
      .where(eq(csrFundings.corporateId, corporateId))
      .orderBy(desc(csrFundings.createdAt));

    return NextResponse.json({ success: true, data: allocations });
  } catch (error) {
    console.error('Error fetching CSR funds:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch CSR funds' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const corporateId = getCurrentCorporateId();
    const body = (await request.json()) as CreatePayload;

    const totalAmount =
      typeof body.totalAmount === 'number'
        ? body.totalAmount
        : typeof body.totalAmount === 'string'
          ? Number.parseFloat(body.totalAmount)
          : NaN;

    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Total amount must be greater than 0' },
        { status: 400 }
      );
    }

    const [allocation] = await db
      .insert(csrFundings)
      .values({
        corporateId,
        totalAmount: totalAmount.toString(),
        remainingAmount: totalAmount.toString(),
        description: description || null,
        status: 'ACTIVE',
      })
      .returning();

    return NextResponse.json({ success: true, data: allocation }, { status: 201 });
  } catch (error) {
    console.error('Error creating CSR allocation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CSR allocation' },
      { status: 500 }
    );
  }
}

