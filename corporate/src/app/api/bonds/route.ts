import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { funds } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

type BondPayload = {
  name?: unknown;
  nav?: unknown;
  minInvestment?: unknown;
  fixedReturn?: unknown;
  maturityDate?: unknown;
  launchDate?: unknown;
  description?: unknown;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(num)) return null;
  return num;
}

function toDateString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    const bonds = await db
      .select()
      .from(funds)
      .where(and(eq(funds.issuerId, corporateId), eq(funds.type, 'GREEN_BOND')))
      .orderBy(funds.createdAt);

    return NextResponse.json({ success: true, data: bonds });
  } catch (error) {
    console.error('Error fetching bonds:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bonds' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const corporateId = getCurrentCorporateId();
    const body = (await request.json()) as BondPayload;

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    const nav = toNumber(body.nav);
    const minInvestment = toNumber(body.minInvestment);
    const fixedReturn = toNumber(body.fixedReturn);
    const launchDate = toDateString(body.launchDate);
    const maturityDate = toDateString(body.maturityDate);

    if (
      !name ||
      !description ||
      nav === null ||
      minInvestment === null ||
      fixedReturn === null ||
      !launchDate ||
      !maturityDate
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (new Date(maturityDate) <= new Date(launchDate)) {
      return NextResponse.json(
        { success: false, error: 'Maturity date must be after launch date' },
        { status: 400 }
      );
    }

    const [newBond] = await db
      .insert(funds)
      .values({
        name,
        type: 'GREEN_BOND',
        nav: nav.toString(),
        minInvestment: minInvestment.toString(),
        fixedReturn: fixedReturn.toString(),
        maturityDate,
        launchDate,
        description,
        issuerId: corporateId,
        issuerType: 'CORPORATE',
        isActive: true,
        cagr1y: null,
        cagr2y: null,
        cagr3y: null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newBond }, { status: 201 });
  } catch (error) {
    console.error('Error creating bond:', error);
    return NextResponse.json({ success: false, error: 'Failed to create bond' }, { status: 500 });
  }
}

