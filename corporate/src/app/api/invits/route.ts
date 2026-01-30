import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { funds } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

type InvitPayload = {
  name?: unknown;
  nav?: unknown;
  minInvestment?: unknown;
  fixedReturn?: unknown;
  cagr1y?: unknown;
  cagr2y?: unknown;
  cagr3y?: unknown;
  expenseRatio?: unknown;
  launchDate?: unknown;
  description?: unknown;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(num)) return null;
  return num;
}

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    const invits = await db
      .select()
      .from(funds)
      .where(and(eq(funds.issuerId, corporateId), eq(funds.type, 'INVIT')))
      .orderBy(funds.createdAt);

    return NextResponse.json({ success: true, data: invits });
  } catch (error) {
    console.error('Error fetching InvITs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch InvITs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const corporateId = getCurrentCorporateId();
    const body = (await request.json()) as InvitPayload;

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const launchDate = typeof body.launchDate === 'string' ? body.launchDate : '';

    const nav = toNumber(body.nav);
    const minInvestment = toNumber(body.minInvestment);
    const fixedReturn = toNumber(body.fixedReturn);
    const cagr1y = toNumber(body.cagr1y);
    const cagr2y = toNumber(body.cagr2y);
    const cagr3y = toNumber(body.cagr3y);
    const expenseRatio = toNumber(body.expenseRatio);

    if (!name || !description || !launchDate || nav === null || minInvestment === null || fixedReturn === null) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [newInvit] = await db
      .insert(funds)
      .values({
        name,
        type: 'INVIT',
        nav: nav.toString(),
        minInvestment: minInvestment.toString(),
        fixedReturn: fixedReturn.toString(),
        cagr1y: cagr1y === null ? null : cagr1y.toString(),
        cagr2y: cagr2y === null ? null : cagr2y.toString(),
        cagr3y: cagr3y === null ? null : cagr3y.toString(),
        expenseRatio: expenseRatio === null ? null : expenseRatio.toString(),
        launchDate,
        description,
        issuerId: corporateId,
        issuerType: 'CORPORATE',
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newInvit }, { status: 201 });
  } catch (error) {
    console.error('Error creating InvIT:', error);
    return NextResponse.json({ success: false, error: 'Failed to create InvIT' }, { status: 500 });
  }
}

