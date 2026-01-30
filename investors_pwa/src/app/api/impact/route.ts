import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { impactMetrics } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const [metrics] = await db.select().from(impactMetrics).where(eq(impactMetrics.userId, userId)).limit(1);

    if (!metrics) {
      return NextResponse.json({
        success: true,
        data: {
          co2Avoided: 0,
          cleanEnergyGenerated: 0,
          airQualityScore: 0,
          treesEquivalent: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        co2Avoided: Number.parseFloat(metrics.co2Avoided || '0'),
        cleanEnergyGenerated: Number.parseFloat(metrics.cleanEnergyGenerated || '0'),
        airQualityScore: Number.parseFloat(metrics.airQualityScore || '0'),
        treesEquivalent: Number.parseInt(metrics.treesEquivalent || '0', 10),
      },
    });
  } catch (error) {
    console.error('Error fetching impact metrics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch impact metrics' }, { status: 500 });
  }
}

