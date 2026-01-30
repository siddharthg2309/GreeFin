import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';

import { funds, holdings, impactMetrics, orders, users } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId, mockUser } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const userOrders = await db
      .select({
        order: orders,
        fund: {
          id: funds.id,
          name: funds.name,
          type: funds.type,
          nav: funds.nav,
        },
      })
      .from(orders)
      .innerJoin(funds, eq(orders.fundId, funds.id))
      .where(eq(orders.userId, userId))
      .orderBy(orders.createdAt);

    return NextResponse.json({
      success: true,
      data: userOrders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json().catch(() => null);

    const fundId = typeof body?.fundId === 'string' ? body.fundId : '';
    const amount = Number(body?.amount);

    if (!fundId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid fund ID or amount' }, { status: 400 });
    }

    const [fund] = await db.select().from(funds).where(eq(funds.id, fundId)).limit(1);
    if (!fund) {
      return NextResponse.json({ success: false, error: 'Fund not found' }, { status: 404 });
    }

    const minInvestment = Number.parseFloat(fund.minInvestment);
    if (amount < minInvestment) {
      return NextResponse.json(
        { success: false, error: `Minimum investment is ₹${minInvestment}` },
        { status: 400 }
      );
    }

    // Ensure the mock user exists (demo safety)
    await db
      .insert(users)
      .values({
        id: userId,
        name: mockUser.name,
        email: mockUser.email,
        greenCredits: '0',
      })
      .onConflictDoNothing();

    const nav = Number.parseFloat(fund.nav);
    const quantity = amount / nav;
    const greenCreditsEarned = amount * 0.05;

    const [newOrder] = await db
      .insert(orders)
      .values({
        userId,
        fundId,
        type: 'BUY',
        amount: amount.toString(),
        quantity: quantity.toString(),
        navAtOrder: fund.nav,
        status: 'COMPLETED',
        greenCreditsEarned: greenCreditsEarned.toString(),
        completedAt: new Date(),
      })
      .returning();

    const [existingHolding] = await db
      .select()
      .from(holdings)
      .where(and(eq(holdings.userId, userId), eq(holdings.fundId, fundId)))
      .limit(1);

    if (existingHolding) {
      const existingQty = Number.parseFloat(existingHolding.quantity);
      const existingInvested = Number.parseFloat(existingHolding.investedAmount);

      const newQty = existingQty + quantity;
      const newInvested = existingInvested + amount;
      const newAvgPrice = newInvested / newQty;

      await db
        .update(holdings)
        .set({
          quantity: newQty.toString(),
          investedAmount: newInvested.toString(),
          avgBuyPrice: newAvgPrice.toString(),
          updatedAt: new Date(),
        })
        .where(eq(holdings.id, existingHolding.id));
    } else {
      await db.insert(holdings).values({
        userId,
        fundId,
        quantity: quantity.toString(),
        avgBuyPrice: fund.nav,
        investedAmount: amount.toString(),
      });
    }

    await db
      .update(users)
      .set({
        greenCredits: sql`coalesce(${users.greenCredits}, 0) + ${greenCreditsEarned}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const co2Impact = amount * 0.001;
    const energyImpact = amount * 0.005;
    const treesImpact = Math.floor(amount / 5000);

    const updated = await db
      .update(impactMetrics)
      .set({
        co2Avoided: sql`coalesce(${impactMetrics.co2Avoided}, 0) + ${co2Impact}`,
        cleanEnergyGenerated: sql`coalesce(${impactMetrics.cleanEnergyGenerated}, 0) + ${energyImpact}`,
        treesEquivalent: sql`coalesce(${impactMetrics.treesEquivalent}, 0) + ${treesImpact}`,
        updatedAt: new Date(),
      })
      .where(eq(impactMetrics.userId, userId))
      .returning();

    if (updated.length === 0) {
      await db.insert(impactMetrics).values({
        userId,
        co2Avoided: co2Impact.toString(),
        cleanEnergyGenerated: energyImpact.toString(),
        treesEquivalent: treesImpact.toString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        order: newOrder,
        greenCreditsEarned,
        message: `Successfully invested ₹${amount} in ${fund.name}. You earned ₹${greenCreditsEarned.toFixed(2)} in Green Credits!`,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

