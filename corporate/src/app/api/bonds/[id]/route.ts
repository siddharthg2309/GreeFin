import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { esgReports, funds } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

type PatchPayload = Record<string, unknown>;

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalNumberString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(num)) return undefined;
  return num.toString();
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const corporateId = getCurrentCorporateId();
    const { id } = await params;

    const [bond] = await db
      .select()
      .from(funds)
      .where(and(eq(funds.id, id), eq(funds.issuerId, corporateId), eq(funds.type, 'GREEN_BOND')));

    if (!bond) {
      return NextResponse.json({ success: false, error: 'Bond not found' }, { status: 404 });
    }

    const reports = await db.select().from(esgReports).where(eq(esgReports.fundId, id));

    return NextResponse.json({ success: true, data: { bond, esgReports: reports } });
  } catch (error) {
    console.error('Error fetching bond:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bond' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const corporateId = getCurrentCorporateId();
    const { id } = await params;
    const body = (await request.json()) as PatchPayload;

    const update: Record<string, unknown> = {};

    const name = toOptionalString(body.name);
    if (name) update.name = name;

    const description = toOptionalString(body.description);
    if (description) update.description = description;

    if (typeof body.launchDate === 'string' && body.launchDate) update.launchDate = body.launchDate;
    if (typeof body.maturityDate === 'string' && body.maturityDate) update.maturityDate = body.maturityDate;

    const nav = toOptionalNumberString(body.nav);
    if (nav !== undefined) update.nav = nav;

    const minInvestment = toOptionalNumberString(body.minInvestment);
    if (minInvestment !== undefined) update.minInvestment = minInvestment;

    const fixedReturn = toOptionalNumberString(body.fixedReturn);
    if (fixedReturn !== undefined) update.fixedReturn = fixedReturn;

    if (typeof body.isActive === 'boolean') update.isActive = body.isActive;

    // Disallow CAGR updates for bonds
    delete update.cagr1y;
    delete update.cagr2y;
    delete update.cagr3y;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    if (typeof update.launchDate === 'string' && typeof update.maturityDate === 'string') {
      if (new Date(update.maturityDate) <= new Date(update.launchDate)) {
        return NextResponse.json(
          { success: false, error: 'Maturity date must be after launch date' },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(funds)
      .set(update)
      .where(and(eq(funds.id, id), eq(funds.issuerId, corporateId), eq(funds.type, 'GREEN_BOND')))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Bond not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating bond:', error);
    return NextResponse.json({ success: false, error: 'Failed to update bond' }, { status: 500 });
  }
}

