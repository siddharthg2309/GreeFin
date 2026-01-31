# Phase 5: CSR Funds Management

## Overview
This phase implements CSR (Corporate Social Responsibility) funds management, allowing corporates to allocate funds that subsidize investor green credit redemptions. When investors claim green credits in the Investors PWA, the redemption is funded from the corporate's CSR allocation.

---

## Features
1. **CSR Overview Page** - View allocations, balance, and redemption history
2. **Allocate Funds Form** - Add new CSR funding allocations
3. **Redemptions Table** - Track all green credit redemptions funded by CSR
4. **API Routes** - CRUD operations for CSR funds and redemption tracking

---

## Business Logic

```
When investor claims green credits (in Investors PWA):
  1. System finds active CSR funding with remaining balance
  2. Deducts creditsRedeemed value from csrFunding.remainingAmount
  3. Links greenCreditClaim to csrFunding via csrFundingId
  4. If remainingAmount <= 0, mark csrFunding as 'EXHAUSTED'
  5. Corporate can view all redemptions in their portal
```

---

## File Structure

```
src/
├── app/
│   ├── csr-funds/
│   │   ├── page.tsx              # CSR overview + redemptions
│   │   └── allocate/
│   │       └── page.tsx          # Allocate new CSR funds
│   └── api/
│       └── csr-funds/
│           ├── route.ts          # GET/POST CSR allocations
│           ├── stats/route.ts    # GET CSR statistics
│           └── redemptions/
│               └── route.ts      # GET redemption history
├── components/
│   ├── forms/
│   │   └── CsrAllocationForm.tsx
│   └── tables/
│       └── RedemptionsTable.tsx
```

---

## API Routes

### GET /api/csr-funds
**Get all CSR allocations for the corporate**

```typescript
// src/app/api/csr-funds/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { csrFundings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getMockCorporate } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporate = getMockCorporate();

    const allocations = await db
      .select()
      .from(csrFundings)
      .where(eq(csrFundings.corporateId, corporate.id))
      .orderBy(desc(csrFundings.createdAt));

    return NextResponse.json({ allocations });
  } catch (error) {
    console.error('Error fetching CSR funds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CSR funds' },
      { status: 500 }
    );
  }
}
```

### POST /api/csr-funds
**Create a new CSR allocation**

```typescript
// src/app/api/csr-funds/route.ts (continued)
export async function POST(request: Request) {
  try {
    const corporate = getMockCorporate();
    const body = await request.json();

    const { totalAmount, description } = body;

    // Validation
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      return NextResponse.json(
        { error: 'Total amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Create CSR allocation
    const [allocation] = await db
      .insert(csrFundings)
      .values({
        corporateId: corporate.id,
        totalAmount: totalAmount.toString(),
        remainingAmount: totalAmount.toString(), // Initially same as total
        description: description || null,
        status: 'ACTIVE',
      })
      .returning();

    return NextResponse.json({ allocation }, { status: 201 });
  } catch (error) {
    console.error('Error creating CSR allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create CSR allocation' },
      { status: 500 }
    );
  }
}
```

### GET /api/csr-funds/stats
**Get CSR statistics**

```typescript
// src/app/api/csr-funds/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { csrFundings, greenCreditClaims } from '@/db/schema';
import { eq, sum, count } from 'drizzle-orm';
import { getMockCorporate } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporate = getMockCorporate();

    // Get all allocations
    const allocations = await db
      .select()
      .from(csrFundings)
      .where(eq(csrFundings.corporateId, corporate.id));

    // Calculate totals
    const totalAllocated = allocations.reduce(
      (sum, a) => sum + parseFloat(a.totalAmount),
      0
    );
    const totalRemaining = allocations.reduce(
      (sum, a) => sum + parseFloat(a.remainingAmount),
      0
    );
    const totalUtilized = totalAllocated - totalRemaining;
    const utilizationPercent = totalAllocated > 0
      ? ((totalUtilized / totalAllocated) * 100).toFixed(1)
      : '0.0';

    // Count allocations by status
    const activeCount = allocations.filter((a) => a.status === 'ACTIVE').length;
    const exhaustedCount = allocations.filter((a) => a.status === 'EXHAUSTED').length;

    // Get redemption count (claims linked to this corporate's CSR funds)
    const allocationIds = allocations.map((a) => a.id);
    let redemptionCount = 0;
    let totalCreditsRedeemed = 0;

    if (allocationIds.length > 0) {
      const claims = await db
        .select()
        .from(greenCreditClaims)
        .where(
          // In a real app, use `inArray` from drizzle-orm
          eq(greenCreditClaims.status, 'APPROVED')
        );

      // Filter claims by csrFundingId
      const linkedClaims = claims.filter((c) =>
        c.csrFundingId && allocationIds.includes(c.csrFundingId)
      );

      redemptionCount = linkedClaims.length;
      totalCreditsRedeemed = linkedClaims.reduce(
        (sum, c) => sum + parseFloat(c.creditsRedeemed || '0'),
        0
      );
    }

    return NextResponse.json({
      stats: {
        totalAllocated,
        totalRemaining,
        totalUtilized,
        utilizationPercent,
        activeCount,
        exhaustedCount,
        redemptionCount,
        totalCreditsRedeemed,
      },
    });
  } catch (error) {
    console.error('Error fetching CSR stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CSR stats' },
      { status: 500 }
    );
  }
}
```

### GET /api/csr-funds/redemptions
**Get all credit redemptions funded by corporate CSR**

```typescript
// src/app/api/csr-funds/redemptions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { csrFundings, greenCreditClaims, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getMockCorporate } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporate = getMockCorporate();

    // Get all CSR allocations for this corporate
    const allocations = await db
      .select()
      .from(csrFundings)
      .where(eq(csrFundings.corporateId, corporate.id));

    const allocationIds = allocations.map((a) => a.id);

    if (allocationIds.length === 0) {
      return NextResponse.json({ redemptions: [] });
    }

    // Get all approved claims
    const claims = await db
      .select({
        id: greenCreditClaims.id,
        userId: greenCreditClaims.userId,
        productName: greenCreditClaims.productName,
        productPrice: greenCreditClaims.productPrice,
        creditsRedeemed: greenCreditClaims.creditsRedeemed,
        csrFundingId: greenCreditClaims.csrFundingId,
        status: greenCreditClaims.status,
        processedAt: greenCreditClaims.processedAt,
        createdAt: greenCreditClaims.createdAt,
      })
      .from(greenCreditClaims)
      .orderBy(desc(greenCreditClaims.createdAt));

    // Filter claims linked to this corporate's CSR funds
    const linkedClaims = claims.filter(
      (c) => c.csrFundingId && allocationIds.includes(c.csrFundingId)
    );

    // Get user details for each claim
    const redemptionsWithUsers = await Promise.all(
      linkedClaims.map(async (claim) => {
        const [user] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, claim.userId));

        return {
          ...claim,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
        };
      })
    );

    return NextResponse.json({ redemptions: redemptionsWithUsers });
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redemptions' },
      { status: 500 }
    );
  }
}
```

---

## Components

### CsrAllocationForm Component

```typescript
// src/components/forms/CsrAllocationForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';

export function CsrAllocationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    totalAmount: '',
    description: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/csr-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: parseFloat(formData.totalAmount),
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to allocate CSR funds');
      }

      router.push('/csr-funds');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Quick add amounts
  const quickAmounts = [100000, 500000, 1000000, 5000000];

  const handleQuickAdd = (amount: number) => {
    setFormData((prev) => ({
      ...prev,
      totalAmount: (parseFloat(prev.totalAmount || '0') + amount).toString(),
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Amount */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Allocation Amount
          </h3>

          <Input
            label="Total Amount (in Rupees)"
            name="totalAmount"
            type="number"
            step="0.01"
            min="1"
            value={formData.totalAmount}
            onChange={handleChange}
            placeholder="Enter CSR allocation amount"
            required
          />

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAdd(amount)}
                className="px-3 py-1.5 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white text-sm rounded-lg transition-colors"
              >
                +Rs. {(amount / 100000).toFixed(0)}L
              </button>
            ))}
          </div>

          {formData.totalAmount && (
            <div className="bg-[#1C1C1E] rounded-lg p-3">
              <p className="text-[#8E8E93] text-sm">
                Amount:{' '}
                <span className="text-white font-medium">
                  Rs. {parseFloat(formData.totalAmount).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Details (Optional)
          </h3>

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the purpose of this CSR allocation (e.g., FY 2025-26 Green Credits Fund)"
            rows={3}
          />
        </div>

        {/* Info */}
        <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg p-4">
          <h4 className="text-[#3B82F6] font-medium text-sm mb-2">
            How CSR Funds Work
          </h4>
          <ul className="text-[#8E8E93] text-sm space-y-1">
            <li>- Allocated funds subsidize investor green credit redemptions</li>
            <li>- When investors claim credits for green purchases, your CSR funds are used</li>
            <li>- Track all redemptions in real-time from this dashboard</li>
            <li>- Allocation is marked as exhausted when fully utilized</li>
          </ul>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !formData.totalAmount}
        >
          {loading ? 'Allocating...' : 'Allocate CSR Funds'}
        </Button>
      </Card>
    </form>
  );
}
```

### RedemptionsTable Component

```typescript
// src/components/tables/RedemptionsTable.tsx
'use client';

import { Card } from '@/components/ui/Card';

interface Redemption {
  id: string;
  userName: string;
  userEmail: string;
  productName: string;
  productPrice: string;
  creditsRedeemed: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

interface RedemptionsTableProps {
  redemptions: Redemption[];
}

export function RedemptionsTable({ redemptions }: RedemptionsTableProps) {
  if (redemptions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[#8E8E93]">
          No redemptions yet. When investors use their green credits to purchase renewable products, they will appear here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2C2C2E]">
              <th className="text-left text-[#8E8E93] text-sm font-medium px-4 py-3">
                User
              </th>
              <th className="text-left text-[#8E8E93] text-sm font-medium px-4 py-3">
                Product
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Product Price
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Credits Used
              </th>
              <th className="text-center text-[#8E8E93] text-sm font-medium px-4 py-3">
                Status
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {redemptions.map((redemption) => (
              <tr
                key={redemption.id}
                className="border-b border-[#2C2C2E] last:border-b-0 hover:bg-[#2C2C2E]/30"
              >
                <td className="px-4 py-4">
                  <div>
                    <span className="text-white font-medium block">
                      {redemption.userName}
                    </span>
                    <span className="text-[#8E8E93] text-sm">
                      {redemption.userEmail}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-white">
                    {redemption.productName || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-[#8E8E93]">
                    Rs. {parseFloat(redemption.productPrice || '0').toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-[#22C55E] font-medium">
                    Rs. {parseFloat(redemption.creditsRedeemed || '0').toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      redemption.status === 'APPROVED'
                        ? 'bg-[#22C55E]/10 text-[#22C55E]'
                        : redemption.status === 'PENDING'
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {redemption.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-[#8E8E93] text-sm">
                    {new Date(redemption.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
```

---

## Pages

### CSR Funds Overview Page

```typescript
// src/app/csr-funds/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RedemptionsTable } from '@/components/tables/RedemptionsTable';

async function getCsrData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const [allocationsRes, statsRes, redemptionsRes] = await Promise.all([
    fetch(`${baseUrl}/api/csr-funds`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/csr-funds/stats`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/csr-funds/redemptions`, { cache: 'no-store' }),
  ]);

  const allocations = allocationsRes.ok
    ? (await allocationsRes.json()).allocations || []
    : [];
  const stats = statsRes.ok
    ? (await statsRes.json()).stats
    : {
        totalAllocated: 0,
        totalRemaining: 0,
        totalUtilized: 0,
        utilizationPercent: '0.0',
        activeCount: 0,
        exhaustedCount: 0,
        redemptionCount: 0,
        totalCreditsRedeemed: 0,
      };
  const redemptions = redemptionsRes.ok
    ? (await redemptionsRes.json()).redemptions || []
    : [];

  return { allocations, stats, redemptions };
}

export default async function CsrFundsPage() {
  const { allocations, stats, redemptions } = await getCsrData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">CSR Funds</h1>
          <p className="text-[#8E8E93] text-sm mt-1">
            Manage CSR allocations and track green credit redemptions
          </p>
        </div>
        <Link href="/csr-funds/allocate">
          <Button>Allocate Funds</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Total Allocated</p>
          <p className="text-2xl font-semibold text-white mt-1">
            Rs. {stats.totalAllocated.toLocaleString('en-IN')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Remaining Balance</p>
          <p className="text-2xl font-semibold text-[#22C55E] mt-1">
            Rs. {stats.totalRemaining.toLocaleString('en-IN')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Utilized</p>
          <p className="text-2xl font-semibold text-[#3B82F6] mt-1">
            Rs. {stats.totalUtilized.toLocaleString('en-IN')}
          </p>
          <p className="text-[#8E8E93] text-xs mt-1">
            {stats.utilizationPercent}% of total
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Redemptions</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {stats.redemptionCount}
          </p>
          <p className="text-[#8E8E93] text-xs mt-1">
            Rs. {stats.totalCreditsRedeemed.toLocaleString('en-IN')} in credits
          </p>
        </Card>
      </div>

      {/* Utilization Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#8E8E93] text-sm">Fund Utilization</span>
          <span className="text-white text-sm font-medium">
            {stats.utilizationPercent}%
          </span>
        </div>
        <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#22C55E] rounded-full transition-all"
            style={{ width: `${Math.min(parseFloat(stats.utilizationPercent), 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-[#8E8E93]">
          <span>{stats.activeCount} active allocation(s)</span>
          <span>{stats.exhaustedCount} exhausted</span>
        </div>
      </Card>

      {/* Allocations List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Allocations</h2>
        {allocations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-[#8E8E93] mb-4">No CSR funds allocated yet</p>
            <Link href="/csr-funds/allocate">
              <Button>Allocate CSR Funds</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {allocations.map((allocation: any) => (
              <Card key={allocation.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          allocation.status === 'ACTIVE'
                            ? 'bg-[#22C55E]/10 text-[#22C55E]'
                            : allocation.status === 'EXHAUSTED'
                            ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                            : 'bg-[#8E8E93]/10 text-[#8E8E93]'
                        }`}
                      >
                        {allocation.status}
                      </span>
                      <span className="text-[#8E8E93] text-xs">
                        {new Date(allocation.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    {allocation.description && (
                      <p className="text-white mt-1">{allocation.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      Rs. {parseFloat(allocation.remainingAmount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[#8E8E93] text-xs">
                      of Rs. {parseFloat(allocation.totalAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="mt-3">
                  <div className="h-1 bg-[#2C2C2E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B82F6] rounded-full"
                      style={{
                        width: `${
                          ((parseFloat(allocation.totalAmount) -
                            parseFloat(allocation.remainingAmount)) /
                            parseFloat(allocation.totalAmount)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Redemptions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Redemptions
        </h2>
        <RedemptionsTable redemptions={redemptions} />
      </div>
    </div>
  );
}
```

### Allocate Funds Page

```typescript
// src/app/csr-funds/allocate/page.tsx
import Link from 'next/link';
import { CsrAllocationForm } from '@/components/forms/CsrAllocationForm';

export default function AllocateCsrPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/csr-funds"
          className="text-[#3B82F6] text-sm hover:underline"
        >
          Back to CSR Funds
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">
          Allocate CSR Funds
        </h1>
        <p className="text-[#8E8E93] text-sm mt-1">
          Add funds to support investor green credit redemptions
        </p>
      </div>

      {/* Form */}
      <CsrAllocationForm />
    </div>
  );
}
```

---

## Integration with Investors PWA

When investors claim green credits in the Investors PWA, the claim API should:

1. Find an active CSR funding with remaining balance
2. Deduct the credit amount from `remainingAmount`
3. Set `csrFundingId` on the `greenCreditClaims` record
4. If `remainingAmount <= 0`, update CSR funding status to `EXHAUSTED`

**Update to Investors PWA claim API:**

```typescript
// investors_pwa/src/app/api/green-credits/claim/route.ts
// Add after claim is approved:

import { csrFundings } from '@/db/schema';
import { eq, gt, and } from 'drizzle-orm';

// Find active CSR funding with balance
const [csrFunding] = await db
  .select()
  .from(csrFundings)
  .where(
    and(
      eq(csrFundings.status, 'ACTIVE'),
      gt(csrFundings.remainingAmount, '0')
    )
  )
  .limit(1);

if (csrFunding) {
  const newRemaining = parseFloat(csrFunding.remainingAmount) - creditsToRedeem;

  await db
    .update(csrFundings)
    .set({
      remainingAmount: Math.max(0, newRemaining).toString(),
      status: newRemaining <= 0 ? 'EXHAUSTED' : 'ACTIVE',
      updatedAt: new Date(),
    })
    .where(eq(csrFundings.id, csrFunding.id));

  // Link claim to CSR funding
  await db
    .update(greenCreditClaims)
    .set({ csrFundingId: csrFunding.id })
    .where(eq(greenCreditClaims.id, claimId));
}
```

---

## Verification Steps

1. **Allocate Funds:** Navigate to `/csr-funds/allocate`, add an allocation
2. **View Overview:** Check stats and allocation list on `/csr-funds`
3. **Progress Bar:** Verify utilization progress bar displays correctly
4. **Redemptions:** When an investor claims credits in Investors PWA, verify:
   - CSR remaining amount is reduced
   - Redemption appears in corporate portal table
5. **Exhausted Status:** When allocation is fully used, status should change to "EXHAUSTED"
6. **Multiple Allocations:** Create multiple allocations, verify totals aggregate correctly

---

## Summary

This completes the Corporate Portal implementation:

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Project Setup & Schema | Complete |
| Phase 2 | Dashboard & Impact Metrics | Complete |
| Phase 3 | Issue InvITs | Complete |
| Phase 4 | Create Green Bonds | Complete |
| Phase 5 | CSR Funds Management | Complete |

The corporate portal now supports:
- Viewing dashboard with aggregated metrics
- Issuing InvITs with optional ESG reports
- Creating Green Bonds with fixed returns
- Managing CSR fund allocations
- Tracking investor green credit redemptions
