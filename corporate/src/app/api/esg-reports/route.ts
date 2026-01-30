import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { esgReports, funds } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

export async function POST(request: Request) {
  try {
    const corporateId = getCurrentCorporateId();
    const formData = await request.formData();

    const fundId = formData.get('fundId');
    const file = formData.get('file');
    const reportYear = formData.get('reportYear');

    if (typeof fundId !== 'string' || !fundId) {
      return NextResponse.json(
        { success: false, error: 'Fund ID is required' },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    const [fund] = await db
      .select({ id: funds.id })
      .from(funds)
      .where(and(eq(funds.id, fundId), eq(funds.issuerId, corporateId)));

    if (!fund) {
      return NextResponse.json({ success: false, error: 'Fund not found' }, { status: 404 });
    }

    const reportUrl = `/uploads/esg-reports/${fundId}/${file.name}`;

    const [report] = await db
      .insert(esgReports)
      .values({
        fundId,
        corporateId,
        reportUrl,
        reportName: file.name,
        reportYear: typeof reportYear === 'string' ? reportYear : null,
        fileSize: file.size ? file.size.toString() : null,
      })
      .returning();

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    console.error('Error uploading ESG report:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload ESG report' }, { status: 500 });
  }
}

