# Phase 3: Transactions - Orders, SIPs, Watchlist, Portfolio

## Overview
Implement Buy orders, SIP creation, Watchlist management, and Portfolio display with P&L tracking.

**UI References:**
- Investments Page: `docs/images/image.png`
- Buy Flow: `docs/images/image copy 6.png`, `docs/images/image copy 13.png`
- SIP Flow: `docs/images/image copy 12.png`

---

## 3.1 Orders API

### Route: `POST /api/orders` - Create Buy Order
**File:** `src/app/api/orders/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, holdings, funds, users, impactMetrics } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

// GET - List user orders
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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create new buy order
export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json();
    const { fundId, amount } = body;

    // Validate input
    if (!fundId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid fund ID or amount' },
        { status: 400 }
      );
    }

    // Get fund details
    const [fund] = await db
      .select()
      .from(funds)
      .where(eq(funds.id, fundId))
      .limit(1);

    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }

    // Validate minimum investment
    const minInvestment = parseFloat(fund.minInvestment);
    if (amount < minInvestment) {
      return NextResponse.json(
        { success: false, error: `Minimum investment is ₹${minInvestment}` },
        { status: 400 }
      );
    }

    const nav = parseFloat(fund.nav);
    const quantity = amount / nav;
    const greenCreditsEarned = amount * 0.05; // 5% green credits

    // Create order (instant completion for mock)
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

    // Update or create holding
    const [existingHolding] = await db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.userId, userId),
          eq(holdings.fundId, fundId)
        )
      )
      .limit(1);

    if (existingHolding) {
      // Update existing holding (weighted average)
      const existingQty = parseFloat(existingHolding.quantity);
      const existingInvested = parseFloat(existingHolding.investedAmount);

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
      // Create new holding
      await db.insert(holdings).values({
        userId,
        fundId,
        quantity: quantity.toString(),
        avgBuyPrice: fund.nav,
        investedAmount: amount.toString(),
      });
    }

    // Update user's green credits
    await db
      .update(users)
      .set({
        greenCredits: db.raw(`green_credits + ${greenCreditsEarned}`),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update impact metrics (mock calculation)
    const co2Impact = amount * 0.001; // 0.001 kg CO2 per rupee invested
    const energyImpact = amount * 0.005; // 0.005 kWh per rupee

    await db
      .update(impactMetrics)
      .set({
        co2Avoided: db.raw(`co2_avoided + ${co2Impact}`),
        cleanEnergyGenerated: db.raw(`clean_energy_generated + ${energyImpact}`),
        treesEquivalent: db.raw(`trees_equivalent + ${Math.floor(amount / 5000)}`),
        updatedAt: new Date(),
      })
      .where(eq(impactMetrics.userId, userId));

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
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

---

### Route: `GET /api/orders/[id]` - Get Order Details
**File:** `src/app/api/orders/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, funds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId();
    const { id } = params;

    const [order] = await db
      .select({
        order: orders,
        fund: funds,
      })
      .from(orders)
      .innerJoin(funds, eq(orders.fundId, funds.id))
      .where(
        and(
          eq(orders.id, id),
          eq(orders.userId, userId)
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
```

---

## 3.2 Portfolio API

### Route: `GET /api/portfolio` - Get Holdings
**File:** `src/app/api/portfolio/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holdings, funds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const userHoldings = await db
      .select({
        holding: holdings,
        fund: funds,
      })
      .from(holdings)
      .innerJoin(funds, eq(holdings.fundId, funds.id))
      .where(eq(holdings.userId, userId));

    // Calculate current value and P&L for each holding
    const enrichedHoldings = userHoldings.map(({ holding, fund }) => {
      const quantity = parseFloat(holding.quantity);
      const avgBuyPrice = parseFloat(holding.avgBuyPrice);
      const currentNav = parseFloat(fund.nav);
      const investedAmount = parseFloat(holding.investedAmount);

      const currentValue = quantity * currentNav;
      const pnl = currentValue - investedAmount;
      const pnlPercent = investedAmount > 0 ? (pnl / investedAmount) * 100 : 0;

      return {
        id: holding.id,
        fund: {
          id: fund.id,
          name: fund.name,
          type: fund.type,
          nav: fund.nav,
        },
        quantity: quantity.toFixed(4),
        avgBuyPrice: avgBuyPrice.toFixed(4),
        investedAmount: investedAmount.toFixed(2),
        currentValue: currentValue.toFixed(2),
        pnl: pnl.toFixed(2),
        pnlPercent: pnlPercent.toFixed(2),
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedHoldings,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
```

---

## 3.3 SIPs API

### Route: `GET/POST /api/sips`
**File:** `src/app/api/sips/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sips, funds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

// GET - List user SIPs
export async function GET() {
  try {
    const userId = getCurrentUserId();

    const userSips = await db
      .select({
        sip: sips,
        fund: {
          id: funds.id,
          name: funds.name,
          type: funds.type,
          nav: funds.nav,
          minInvestment: funds.minInvestment,
        },
      })
      .from(sips)
      .innerJoin(funds, eq(sips.fundId, funds.id))
      .where(eq(sips.userId, userId))
      .orderBy(sips.createdAt);

    return NextResponse.json({
      success: true,
      data: userSips,
    });
  } catch (error) {
    console.error('Error fetching SIPs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SIPs' },
      { status: 500 }
    );
  }
}

// POST - Create new SIP
export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json();
    const { fundId, installmentAmount, frequency, startDate } = body;

    // Validate input
    if (!fundId || !installmentAmount || !frequency || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get fund details
    const [fund] = await db
      .select()
      .from(funds)
      .where(eq(funds.id, fundId))
      .limit(1);

    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }

    // Validate minimum investment
    const minInvestment = parseFloat(fund.minInvestment);
    if (installmentAmount < minInvestment) {
      return NextResponse.json(
        { success: false, error: `Minimum SIP amount is ₹${minInvestment}` },
        { status: 400 }
      );
    }

    // Validate frequency
    if (!['WEEKLY', 'MONTHLY'].includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Frequency must be WEEKLY or MONTHLY' },
        { status: 400 }
      );
    }

    // Calculate next execution date
    const start = new Date(startDate);
    const nextExecution = new Date(start);
    if (frequency === 'WEEKLY') {
      nextExecution.setDate(nextExecution.getDate() + 7);
    } else {
      nextExecution.setMonth(nextExecution.getMonth() + 1);
    }

    // Create SIP
    const [newSip] = await db
      .insert(sips)
      .values({
        userId,
        fundId,
        installmentAmount: installmentAmount.toString(),
        frequency: frequency as 'WEEKLY' | 'MONTHLY',
        startDate: start.toISOString().split('T')[0],
        nextExecutionDate: nextExecution.toISOString().split('T')[0],
        status: 'ACTIVE',
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        sip: newSip,
        fund: {
          id: fund.id,
          name: fund.name,
        },
        message: `SIP created for ${fund.name}. First installment of ₹${installmentAmount} will be invested on ${startDate}.`,
      },
    });
  } catch (error) {
    console.error('Error creating SIP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create SIP' },
      { status: 500 }
    );
  }
}
```

---

### Route: `PATCH /api/sips/[id]` - Update SIP Status
**File:** `src/app/api/sips/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sips } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId();
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existingSip] = await db
      .select()
      .from(sips)
      .where(
        and(
          eq(sips.id, id),
          eq(sips.userId, userId)
        )
      )
      .limit(1);

    if (!existingSip) {
      return NextResponse.json(
        { success: false, error: 'SIP not found' },
        { status: 404 }
      );
    }

    // Update SIP
    const [updatedSip] = await db
      .update(sips)
      .set({ status: status as 'ACTIVE' | 'PAUSED' | 'CANCELLED' })
      .where(eq(sips.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedSip,
      message: `SIP ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Error updating SIP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update SIP' },
      { status: 500 }
    );
  }
}
```

---

## 3.4 Watchlist API

### Route: `GET/POST /api/watchlist`
**File:** `src/app/api/watchlist/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { watchlist, funds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

// GET - List user watchlist
export async function GET() {
  try {
    const userId = getCurrentUserId();

    const userWatchlist = await db
      .select({
        id: watchlist.id,
        createdAt: watchlist.createdAt,
        fund: funds,
      })
      .from(watchlist)
      .innerJoin(funds, eq(watchlist.fundId, funds.id))
      .where(eq(watchlist.userId, userId))
      .orderBy(watchlist.createdAt);

    return NextResponse.json({
      success: true,
      data: userWatchlist,
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST - Add to watchlist
export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json();
    const { fundId } = body;

    if (!fundId) {
      return NextResponse.json(
        { success: false, error: 'Fund ID required' },
        { status: 400 }
      );
    }

    // Check if fund exists
    const [fund] = await db
      .select()
      .from(funds)
      .where(eq(funds.id, fundId))
      .limit(1);

    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }

    // Check if already in watchlist
    const [existing] = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.fundId, fundId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Fund already in watchlist' },
        { status: 400 }
      );
    }

    // Add to watchlist
    const [newEntry] = await db
      .insert(watchlist)
      .values({ userId, fundId })
      .returning();

    return NextResponse.json({
      success: true,
      data: newEntry,
      message: `${fund.name} added to watchlist`,
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}
```

---

### Route: `DELETE /api/watchlist/[fundId]`
**File:** `src/app/api/watchlist/[fundId]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { watchlist } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

export async function DELETE(
  request: Request,
  { params }: { params: { fundId: string } }
) {
  try {
    const userId = getCurrentUserId();
    const { fundId } = params;

    const result = await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.fundId, fundId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Fund not in watchlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}
```

---

## 3.5 Buy Modal Component

### File: `src/components/fund/BuyModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import type { Fund } from '@/db/schema';

interface BuyModalProps {
  fund: Fund;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function BuyModal({ fund, onClose, onSuccess }: BuyModalProps) {
  const [amount, setAmount] = useState(parseFloat(fund.minInvestment));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nav = parseFloat(fund.nav);
  const minInvestment = parseFloat(fund.minInvestment);
  const quantity = amount / nav;
  const greenCredits = amount * 0.05;

  const handleQuickAdd = (addAmount: number) => {
    setAmount(prev => prev + addAmount);
  };

  const handleBuy = async () => {
    if (amount < minInvestment) {
      setError(`Minimum investment is ${formatCurrency(minInvestment)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundId: fund.id, amount }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to place order');
        return;
      }

      onSuccess(data.data);
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-gray-900 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Buy</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fund Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full" />
          <div>
            <h3 className="font-medium">{fund.name}</h3>
            <p className="text-sm text-gray-500">{fund.type.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-2">Investment amount</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl">₹</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="text-2xl bg-transparent border-none p-0"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickAdd(500)}
                className="text-blue-500 text-sm"
              >
                +500
              </button>
              <button
                onClick={() => handleQuickAdd(1000)}
                className="text-blue-500 text-sm"
              >
                +1000
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Min. {formatCurrency(minInvestment)} (multiple of ₹1)
          </p>
        </div>

        {/* NAV Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500">Place order at NAV</p>
          <p className="text-lg">₹ {nav.toFixed(4)}</p>
          <p className="text-xs text-gray-500">Current NAV: ₹{nav.toFixed(4)}</p>
        </div>

        {/* Summary */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Units (approx.)</span>
            <span>{quantity.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Green Credits earned</span>
            <span className="text-green-500">+{formatCurrency(greenCredits)}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* Buy Button */}
        <Button
          onClick={handleBuy}
          disabled={loading || amount < minInvestment}
          className="w-full"
          size="lg"
        >
          {loading ? 'Processing...' : `Buy for ${formatCurrency(amount)}`}
        </Button>
      </div>
    </div>
  );
}
```

---

## 3.6 SIP Modal Component

### File: `src/components/fund/SipModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import type { Fund } from '@/db/schema';

interface SipModalProps {
  fund: Fund;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function SipModal({ fund, onClose, onSuccess }: SipModalProps) {
  const minInvestment = parseFloat(fund.minInvestment);

  const [installmentAmount, setInstallmentAmount] = useState(minInvestment);
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateSip = async () => {
    if (installmentAmount < minInvestment) {
      setError(`Minimum SIP amount is ${formatCurrency(minInvestment)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundId: fund.id,
          installmentAmount,
          frequency,
          startDate,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to create SIP');
        return;
      }

      onSuccess(data.data);
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-gray-900 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create SIP</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fund Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full" />
          <div>
            <h3 className="font-medium">{fund.name}</h3>
            <p className="text-sm text-gray-500">{fund.type.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Installment Amount */}
        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-2">
            Installment amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xl">₹</span>
            <Input
              type="number"
              value={installmentAmount}
              onChange={(e) => setInstallmentAmount(parseFloat(e.target.value) || 0)}
              className="text-2xl bg-transparent border-none p-0"
            />
            <button
              onClick={() => setInstallmentAmount(prev => prev + 1000)}
              className="text-blue-500 text-sm"
            >
              +1000
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Min. {formatCurrency(minInvestment)} (multiple of ₹1)
          </p>
        </div>

        {/* Frequency */}
        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-2">Frequency</label>
          <div className="flex gap-4">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'WEEKLY' | 'MONTHLY')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 flex-1"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div className="mb-6">
          <label className="text-sm text-gray-500 block mb-2">Start date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Amount per installment</span>
            <span>{formatCurrency(installmentAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Frequency</span>
            <span>{frequency.charAt(0) + frequency.slice(1).toLowerCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Green Credits per installment</span>
            <span className="text-green-500">
              +{formatCurrency(installmentAmount * 0.05)}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Create Button */}
        <Button
          onClick={handleCreateSip}
          disabled={loading || installmentAmount < minInvestment}
          className="w-full"
          size="lg"
        >
          {loading ? 'Creating...' : 'Create SIP'}
        </Button>
      </div>
    </div>
  );
}
```

---

## 3.7 Investments Page

### File: `src/app/investments/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Briefcase } from 'lucide-react';
import Link from 'next/link';

type Tab = 'portfolio' | 'sips' | 'orders';

export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('portfolio');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      const endpoint =
        activeTab === 'portfolio'
          ? '/api/portfolio'
          : activeTab === 'sips'
          ? '/api/sips'
          : '/api/orders';

      const res = await fetch(endpoint);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-800">
        {(['portfolio', 'sips', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-medium capitalize ${
              activeTab === tab
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-500'
            }`}
          >
            {tab === 'sips' ? 'SIPs' : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : data.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-4">
          {activeTab === 'portfolio' && <PortfolioList holdings={data} />}
          {activeTab === 'sips' && <SipsList sips={data} onUpdate={fetchData} />}
          {activeTab === 'orders' && <OrdersList orders={data} />}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Briefcase className="w-16 h-16 text-blue-500 mb-4" />
      <p className="text-lg mb-2">
        {tab === 'portfolio'
          ? "You don't have any investments"
          : tab === 'sips'
          ? "You don't have any SIPs"
          : 'No orders yet'}
      </p>
      <Link href="/discover" className="text-blue-500">
        {tab === 'portfolio' ? 'Invest now' : 'Explore funds'}
      </Link>
    </div>
  );
}

function PortfolioList({ holdings }: { holdings: any[] }) {
  return (
    <>
      {holdings.map((item) => (
        <Card key={item.id}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{item.fund.name}</h3>
              <p className="text-sm text-gray-500">
                {item.quantity} units @ {formatCurrency(item.avgBuyPrice)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatCurrency(item.currentValue)}</p>
              <p
                className={`text-sm ${
                  parseFloat(item.pnl) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {formatCurrency(item.pnl)} ({formatPercent(parseFloat(item.pnlPercent))})
              </p>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

function SipsList({ sips, onUpdate }: { sips: any[]; onUpdate: () => void }) {
  const handleStatusChange = async (sipId: string, newStatus: string) => {
    try {
      await fetch(`/api/sips/${sipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating SIP:', error);
    }
  };

  return (
    <>
      {sips.map(({ sip, fund }) => (
        <Card key={sip.id}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium">{fund.name}</h3>
              <p className="text-sm text-gray-500">
                {formatCurrency(sip.installmentAmount)} / {sip.frequency.toLowerCase()}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                sip.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-500'
                  : sip.status === 'PAUSED'
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-red-500/20 text-red-500'
              }`}
            >
              {sip.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Next: {new Date(sip.nextExecutionDate).toLocaleDateString('en-IN')}
          </p>
          {sip.status === 'ACTIVE' && (
            <button
              onClick={() => handleStatusChange(sip.id, 'PAUSED')}
              className="text-sm text-yellow-500"
            >
              Pause SIP
            </button>
          )}
          {sip.status === 'PAUSED' && (
            <button
              onClick={() => handleStatusChange(sip.id, 'ACTIVE')}
              className="text-sm text-green-500"
            >
              Resume SIP
            </button>
          )}
        </Card>
      ))}
    </>
  );
}

function OrdersList({ orders }: { orders: any[] }) {
  return (
    <>
      {orders.map(({ order, fund }) => (
        <Card key={order.id}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{fund.name}</h3>
              <p className="text-sm text-gray-500">
                {order.type} • {formatCurrency(order.amount)}
              </p>
              <p className="text-xs text-gray-600">
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                order.status === 'COMPLETED'
                  ? 'bg-green-500/20 text-green-500'
                  : order.status === 'PENDING'
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-red-500/20 text-red-500'
              }`}
            >
              {order.status}
            </span>
          </div>
          {order.greenCreditsEarned && parseFloat(order.greenCreditsEarned) > 0 && (
            <p className="text-xs text-green-500 mt-2">
              +{formatCurrency(order.greenCreditsEarned)} Green Credits earned
            </p>
          )}
        </Card>
      ))}
    </>
  );
}
```

---

## Phase 3 Checklist

- [ ] Create `POST /api/orders` route (buy order)
- [ ] Create `GET /api/orders` route (list orders)
- [ ] Create `GET /api/orders/[id]` route
- [ ] Create `GET /api/portfolio` route (holdings)
- [ ] Create `GET/POST /api/sips` route
- [ ] Create `PATCH /api/sips/[id]` route
- [ ] Create `GET/POST /api/watchlist` route
- [ ] Create `DELETE /api/watchlist/[fundId]` route
- [ ] Create BuyModal component
- [ ] Create SipModal component
- [ ] Create FundActions component
- [ ] Create Investments page with tabs
- [ ] Test order flow with green credits
- [ ] Test SIP create/pause/cancel
- [ ] Test watchlist add/remove

---

## Next: [Phase 4 - Green Credits & AI](./phase4.md)
