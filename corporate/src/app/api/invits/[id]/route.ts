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
    const [invit] = await db
      .select()
      .from(funds)
      .where(and(eq(funds.id, id), eq(funds.issuerId, corporateId), eq(funds.type, 'INVIT')));

    if (!invit) {
      return NextResponse.json({ success: false, error: 'InvIT not found' }, { status: 404 });
    }

    const reports = await db.select().from(esgReports).where(eq(esgReports.fundId, id));

    return NextResponse.json({ success: true, data: { invit, esgReports: reports } });
  } catch (error) {
    console.error('Error fetching InvIT:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch InvIT' }, { status: 500 });
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

    const nav = toOptionalNumberString(body.nav);
    if (nav !== undefined) update.nav = nav;

    const minInvestment = toOptionalNumberString(body.minInvestment);
    if (minInvestment !== undefined) update.minInvestment = minInvestment;

    const fixedReturn = toOptionalNumberString(body.fixedReturn);
    if (fixedReturn !== undefined) update.fixedReturn = fixedReturn;

    const cagr1y = toOptionalNumberString(body.cagr1y);
    if (cagr1y !== undefined) update.cagr1y = cagr1y;

    const cagr2y = toOptionalNumberString(body.cagr2y);
    if (cagr2y !== undefined) update.cagr2y = cagr2y;

    const cagr3y = toOptionalNumberString(body.cagr3y);
    if (cagr3y !== undefined) update.cagr3y = cagr3y;

    const expenseRatio = toOptionalNumberString(body.expenseRatio);
    if (expenseRatio !== undefined) update.expenseRatio = expenseRatio;

    if (typeof body.isActive === 'boolean') update.isActive = body.isActive;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const [updated] = await db
      .update(funds)
      .set(update)
      .where(and(eq(funds.id, id), eq(funds.issuerId, corporateId), eq(funds.type, 'INVIT')))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'InvIT not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating InvIT:', error);
    return NextResponse.json({ success: false, error: 'Failed to update InvIT' }, { status: 500 });
  }
}
