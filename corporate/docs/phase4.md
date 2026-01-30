# Phase 4: Create Green Bonds

## Overview
This phase implements the Green Bond creation functionality. Unlike InvITs, Green Bonds have **fixed returns only** (no NAV appreciation or CAGR data) and have a fixed maturity date.

---

## Key Differences: InvIT vs Green Bond

| Aspect | InvIT | Green Bond |
|--------|-------|------------|
| Returns | Fixed Return + NAV Appreciation | Fixed Return Only |
| CAGR Data | Yes (1Y, 2Y, 3Y) | No |
| NAV Changes | Yes (fluctuates) | No (fixed face value) |
| Risk Profile | Medium | Low |
| Maturity | Open-ended | Fixed maturity date |

---

## Features
1. **Green Bonds List Page** - View all bonds issued by the corporate
2. **Create Bond Form** - Simplified form (no CAGR fields)
3. **ESG Report Upload** - Optional PDF upload
4. **API Routes** - CRUD operations for bonds

---

## File Structure

```
src/
├── app/
│   ├── bonds/
│   │   ├── page.tsx              # List Green Bonds
│   │   └── create/
│   │       └── page.tsx          # Create Bond form
│   └── api/
│       └── bonds/
│           ├── route.ts          # GET/POST Bonds
│           └── [id]/route.ts     # GET/PATCH single Bond
├── components/
│   └── forms/
│       └── BondForm.tsx
```

---

## API Routes

### GET /api/bonds
**Get all Green Bonds for the corporate**

```typescript
// src/app/api/bonds/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getMockCorporate } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporate = getMockCorporate();

    const bonds = await db
      .select({
        id: funds.id,
        name: funds.name,
        nav: funds.nav,
        minInvestment: funds.minInvestment,
        fixedReturn: funds.fixedReturn,
        maturityDate: funds.maturityDate,
        launchDate: funds.launchDate,
        description: funds.description,
        isActive: funds.isActive,
        createdAt: funds.createdAt,
      })
      .from(funds)
      .where(
        and(
          eq(funds.issuerId, corporate.id),
          eq(funds.type, 'GREEN_BOND')
        )
      )
      .orderBy(funds.createdAt);

    return NextResponse.json({ bonds });
  } catch (error) {
    console.error('Error fetching bonds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bonds' },
      { status: 500 }
    );
  }
}
```

### POST /api/bonds
**Create a new Green Bond**

```typescript
// src/app/api/bonds/route.ts (continued)
export async function POST(request: Request) {
  try {
    const corporate = getMockCorporate();
    const body = await request.json();

    const {
      name,
      nav,
      minInvestment,
      fixedReturn,
      maturityDate,
      launchDate,
      description,
    } = body;

    // Validation
    if (!name || !nav || !minInvestment || !fixedReturn || !maturityDate || !launchDate || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate maturity date is after launch date
    if (new Date(maturityDate) <= new Date(launchDate)) {
      return NextResponse.json(
        { error: 'Maturity date must be after launch date' },
        { status: 400 }
      );
    }

    // Create Green Bond in funds table
    // Note: No CAGR fields for bonds
    const [newBond] = await db
      .insert(funds)
      .values({
        name,
        type: 'GREEN_BOND',
        nav: nav.toString(),
        minInvestment: minInvestment.toString(),
        fixedReturn: fixedReturn.toString(),
        maturityDate: new Date(maturityDate),
        launchDate: new Date(launchDate),
        description,
        issuerId: corporate.id,
        issuerType: 'CORPORATE',
        isActive: true,
        // No CAGR fields - these are null for bonds
        cagr1y: null,
        cagr2y: null,
        cagr3y: null,
      })
      .returning();

    return NextResponse.json({ bond: newBond }, { status: 201 });
  } catch (error) {
    console.error('Error creating bond:', error);
    return NextResponse.json(
      { error: 'Failed to create bond' },
      { status: 500 }
    );
  }
}
```

### GET /api/bonds/[id]
**Get single bond details**

```typescript
// src/app/api/bonds/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds, esgReports } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [bond] = await db
      .select()
      .from(funds)
      .where(eq(funds.id, params.id));

    if (!bond) {
      return NextResponse.json(
        { error: 'Bond not found' },
        { status: 404 }
      );
    }

    // Get ESG reports for this bond
    const reports = await db
      .select()
      .from(esgReports)
      .where(eq(esgReports.fundId, params.id));

    return NextResponse.json({ bond, esgReports: reports });
  } catch (error) {
    console.error('Error fetching bond:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bond' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Don't allow updating CAGR fields for bonds
    const { cagr1y, cagr2y, cagr3y, ...updateData } = body;

    const [updated] = await db
      .update(funds)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(funds.id, params.id))
      .returning();

    return NextResponse.json({ bond: updated });
  } catch (error) {
    console.error('Error updating bond:', error);
    return NextResponse.json(
      { error: 'Failed to update bond' },
      { status: 500 }
    );
  }
}
```

---

## Components

### BondForm Component

```typescript
// src/components/forms/BondForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { EsgUpload } from './EsgUpload';

interface BondFormData {
  name: string;
  nav: string;
  minInvestment: string;
  fixedReturn: string;
  maturityDate: string;
  launchDate: string;
  description: string;
}

export function BondForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFundId, setCreatedFundId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BondFormData>({
    name: '',
    nav: '1000', // Default face value for bonds
    minInvestment: '',
    fixedReturn: '',
    maturityDate: '',
    launchDate: '',
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

    // Client-side validation
    if (new Date(formData.maturityDate) <= new Date(formData.launchDate)) {
      setError('Maturity date must be after launch date');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/bonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nav: parseFloat(formData.nav),
          minInvestment: parseFloat(formData.minInvestment),
          fixedReturn: parseFloat(formData.fixedReturn),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create bond');
      }

      const data = await response.json();
      setCreatedFundId(data.bond.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEsgUploadComplete = () => {
    router.push('/bonds');
  };

  const handleSkipEsg = () => {
    router.push('/bonds');
  };

  // Show ESG upload step after bond is created
  if (createdFundId) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Upload ESG Report (Optional)
        </h2>
        <p className="text-[#8E8E93] text-sm mb-6">
          Green Bond created successfully. You can now upload an ESG compliance report.
        </p>
        <EsgUpload
          fundId={createdFundId}
          onComplete={handleEsgUploadComplete}
        />
        <Button
          variant="ghost"
          onClick={handleSkipEsg}
          className="mt-4 w-full"
        >
          Skip for now
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Basic Information
          </h3>

          <Input
            label="Bond Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter Green Bond name"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the green project this bond funds"
            rows={4}
            required
          />
        </div>

        {/* Financial Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Financial Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Face Value (NAV in Rupees)"
              name="nav"
              type="number"
              step="0.01"
              value={formData.nav}
              onChange={handleChange}
              placeholder="1000.00"
              required
            />

            <Input
              label="Min Investment (in Rupees)"
              name="minInvestment"
              type="number"
              step="0.01"
              value={formData.minInvestment}
              onChange={handleChange}
              placeholder="1000.00"
              required
            />
          </div>

          <Input
            label="Coupon Rate / Fixed Return (%)"
            name="fixedReturn"
            type="number"
            step="0.01"
            value={formData.fixedReturn}
            onChange={handleChange}
            placeholder="7.5"
            required
          />

          <div className="bg-[#2C2C2E]/50 rounded-lg p-3">
            <p className="text-[#8E8E93] text-xs">
              Note: Green Bonds have fixed returns only. Unlike InvITs, there is no NAV appreciation or CAGR data.
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Issue & Maturity
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date (Launch)"
              name="launchDate"
              type="date"
              value={formData.launchDate}
              onChange={handleChange}
              required
            />

            <Input
              label="Maturity Date"
              name="maturityDate"
              type="date"
              value={formData.maturityDate}
              onChange={handleChange}
              required
            />
          </div>

          {formData.launchDate && formData.maturityDate && (
            <div className="bg-[#1C1C1E] rounded-lg p-3">
              <p className="text-[#8E8E93] text-sm">
                Tenure:{' '}
                <span className="text-white font-medium">
                  {Math.ceil(
                    (new Date(formData.maturityDate).getTime() -
                      new Date(formData.launchDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 365)
                  )}{' '}
                  year(s)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating Bond...' : 'Create Green Bond'}
        </Button>
      </Card>
    </form>
  );
}
```

---

## Pages

### Green Bonds List Page

```typescript
// src/app/bonds/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FundsTable } from '@/components/tables/FundsTable';
import { Card } from '@/components/ui/Card';

async function getBonds() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bonds`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.bonds || [];
}

export default async function BondsPage() {
  const bonds = await getBonds();

  // Calculate total value (NAV * estimated units - for demo purposes)
  const totalValue = bonds.reduce(
    (sum: number, b: any) => sum + parseFloat(b.nav || 0) * 1000,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Green Bonds</h1>
          <p className="text-[#8E8E93] text-sm mt-1">
            Manage your Green Bond issuances
          </p>
        </div>
        <Link href="/bonds/create">
          <Button>Issue New Bond</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Total Bonds</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {bonds.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Active Bonds</p>
          <p className="text-2xl font-semibold text-[#22C55E] mt-1">
            {bonds.filter((b: any) => b.isActive).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Avg. Coupon Rate</p>
          <p className="text-2xl font-semibold text-[#3B82F6] mt-1">
            {bonds.length > 0
              ? (
                  bonds.reduce(
                    (sum: number, b: any) => sum + parseFloat(b.fixedReturn || 0),
                    0
                  ) / bonds.length
                ).toFixed(2)
              : '0.00'}
            %
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Total Issue Value</p>
          <p className="text-2xl font-semibold text-white mt-1">
            Rs. {totalValue.toLocaleString('en-IN')}
          </p>
        </Card>
      </div>

      {/* Bonds Table */}
      <BondsTable bonds={bonds} />
    </div>
  );
}

// Custom table for bonds with maturity date
function BondsTable({ bonds }: { bonds: any[] }) {
  if (bonds.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[#8E8E93] mb-4">No Green Bonds created yet</p>
        <Link href="/bonds/create">
          <Button>Create Green Bond</Button>
        </Link>
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
                Name
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Face Value
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Coupon Rate
              </th>
              <th className="text-center text-[#8E8E93] text-sm font-medium px-4 py-3">
                Maturity
              </th>
              <th className="text-center text-[#8E8E93] text-sm font-medium px-4 py-3">
                Status
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bonds.map((bond) => {
              const maturityDate = bond.maturityDate
                ? new Date(bond.maturityDate)
                : null;
              const isMatured = maturityDate && maturityDate < new Date();

              return (
                <tr
                  key={bond.id}
                  className="border-b border-[#2C2C2E] last:border-b-0 hover:bg-[#2C2C2E]/30"
                >
                  <td className="px-4 py-4">
                    <span className="text-white font-medium">{bond.name}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-white">
                      Rs. {parseFloat(bond.nav).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-[#22C55E]">
                      {parseFloat(bond.fixedReturn).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {maturityDate ? (
                      <span className={isMatured ? 'text-[#F59E0B]' : 'text-[#8E8E93]'}>
                        {maturityDate.toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-[#8E8E93]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        isMatured
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          : bond.isActive
                          ? 'bg-[#22C55E]/10 text-[#22C55E]'
                          : 'bg-[#8E8E93]/10 text-[#8E8E93]'
                      }`}
                    >
                      {isMatured ? 'Matured' : bond.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/bonds/${bond.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
```

### Create Bond Page

```typescript
// src/app/bonds/create/page.tsx
import Link from 'next/link';
import { BondForm } from '@/components/forms/BondForm';

export default function CreateBondPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/bonds"
          className="text-[#3B82F6] text-sm hover:underline"
        >
          Back to Green Bonds
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">
          Issue New Green Bond
        </h1>
        <p className="text-[#8E8E93] text-sm mt-1">
          Create a Green Bond to fund sustainable infrastructure projects
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg p-4">
        <h3 className="text-[#3B82F6] font-medium text-sm mb-2">
          About Green Bonds
        </h3>
        <ul className="text-[#8E8E93] text-sm space-y-1">
          <li>- Fixed coupon rate (no NAV appreciation)</li>
          <li>- Fixed maturity date</li>
          <li>- Lower risk profile than InvITs</li>
          <li>- Funds specific green projects</li>
        </ul>
      </div>

      {/* Form */}
      <BondForm />
    </div>
  );
}
```

---

## Schema Note

Ensure the `funds` table has a `maturityDate` column for bonds:

```typescript
// Add to funds table in schema.ts if not present
maturityDate: timestamp('maturity_date'), // Only used for GREEN_BOND type
```

---

## Verification Steps

1. **List Page:** Navigate to `/bonds` - should show empty state or list of bonds
2. **Create Bond:** Fill the form with required fields, ensure maturity > launch date
3. **Tenure Calculation:** Verify the tenure is calculated correctly from dates
4. **ESG Upload:** After creating, optionally upload an ESG report PDF
5. **View in Table:** New bond should appear with maturity date displayed
6. **Status Display:** Matured bonds should show "Matured" status
7. **Investor Visibility:** Bond should be visible in Investors PWA under "Explore > Green Bonds"

---

## Next Phase
[Phase 5: CSR Funds Management](./phase5.md)
