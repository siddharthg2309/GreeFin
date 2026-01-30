# Phase 3: Issue InvITs

## Overview
This phase implements the InvIT (Infrastructure Investment Trust) creation functionality, allowing corporates to issue InvITs that will be visible to investors in the Investors PWA.

---

## Features
1. **InvITs List Page** - View all InvITs issued by the corporate
2. **Create InvIT Form** - Form to create new InvIT with all required fields
3. **ESG Report Upload** - Optional PDF upload for ESG compliance reports
4. **API Routes** - CRUD operations for InvITs

---

## File Structure

```
src/
├── app/
│   ├── invits/
│   │   ├── page.tsx              # List InvITs
│   │   └── create/
│   │       └── page.tsx          # Create InvIT form
│   └── api/
│       ├── invits/
│       │   ├── route.ts          # GET/POST InvITs
│       │   └── [id]/route.ts     # GET/PATCH single InvIT
│       └── esg-reports/
│           └── route.ts          # POST upload ESG report
├── components/
│   ├── forms/
│   │   ├── InvitForm.tsx
│   │   └── EsgUpload.tsx
│   └── tables/
│       └── FundsTable.tsx
└── lib/
    └── upload.ts                 # File upload utility
```

---

## API Routes

### GET /api/invits
**Get all InvITs for the corporate**

```typescript
// src/app/api/invits/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds, esgReports } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getMockCorporate } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporate = getMockCorporate();

    const invits = await db
      .select({
        id: funds.id,
        name: funds.name,
        nav: funds.nav,
        minInvestment: funds.minInvestment,
        fixedReturn: funds.fixedReturn,
        cagr1y: funds.cagr1y,
        cagr2y: funds.cagr2y,
        cagr3y: funds.cagr3y,
        expenseRatio: funds.expenseRatio,
        launchDate: funds.launchDate,
        description: funds.description,
        isActive: funds.isActive,
        createdAt: funds.createdAt,
      })
      .from(funds)
      .where(
        and(
          eq(funds.issuerId, corporate.id),
          eq(funds.type, 'INVIT')
        )
      )
      .orderBy(funds.createdAt);

    return NextResponse.json({ invits });
  } catch (error) {
    console.error('Error fetching InvITs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch InvITs' },
      { status: 500 }
    );
  }
}
```

### POST /api/invits
**Create a new InvIT**

```typescript
// src/app/api/invits/route.ts (continued)
export async function POST(request: Request) {
  try {
    const corporate = getMockCorporate();
    const body = await request.json();

    const {
      name,
      nav,
      minInvestment,
      fixedReturn,
      cagr1y,
      cagr2y,
      cagr3y,
      expenseRatio,
      launchDate,
      description,
    } = body;

    // Validation
    if (!name || !nav || !minInvestment || !fixedReturn || !launchDate || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create InvIT in funds table
    const [newInvit] = await db
      .insert(funds)
      .values({
        name,
        type: 'INVIT',
        nav: nav.toString(),
        minInvestment: minInvestment.toString(),
        fixedReturn: fixedReturn.toString(),
        cagr1y: cagr1y?.toString() || null,
        cagr2y: cagr2y?.toString() || null,
        cagr3y: cagr3y?.toString() || null,
        expenseRatio: expenseRatio?.toString() || null,
        launchDate: new Date(launchDate),
        description,
        issuerId: corporate.id,
        issuerType: 'CORPORATE',
        isActive: true,
      })
      .returning();

    return NextResponse.json({ invit: newInvit }, { status: 201 });
  } catch (error) {
    console.error('Error creating InvIT:', error);
    return NextResponse.json(
      { error: 'Failed to create InvIT' },
      { status: 500 }
    );
  }
}
```

### GET /api/invits/[id]
**Get single InvIT details**

```typescript
// src/app/api/invits/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds, esgReports } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [invit] = await db
      .select()
      .from(funds)
      .where(eq(funds.id, params.id));

    if (!invit) {
      return NextResponse.json(
        { error: 'InvIT not found' },
        { status: 404 }
      );
    }

    // Get ESG reports for this fund
    const reports = await db
      .select()
      .from(esgReports)
      .where(eq(esgReports.fundId, params.id));

    return NextResponse.json({ invit, esgReports: reports });
  } catch (error) {
    console.error('Error fetching InvIT:', error);
    return NextResponse.json(
      { error: 'Failed to fetch InvIT' },
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

    const [updated] = await db
      .update(funds)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(funds.id, params.id))
      .returning();

    return NextResponse.json({ invit: updated });
  } catch (error) {
    console.error('Error updating InvIT:', error);
    return NextResponse.json(
      { error: 'Failed to update InvIT' },
      { status: 500 }
    );
  }
}
```

### POST /api/esg-reports
**Upload ESG report for a fund**

```typescript
// src/app/api/esg-reports/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { esgReports } from '@/db/schema';
import { getMockCorporate } from '@/lib/mock-corporate';

export async function POST(request: Request) {
  try {
    const corporate = getMockCorporate();
    const formData = await request.formData();

    const fundId = formData.get('fundId') as string;
    const file = formData.get('file') as File;
    const reportYear = formData.get('reportYear') as string;

    if (!fundId || !file) {
      return NextResponse.json(
        { error: 'Fund ID and file are required' },
        { status: 400 }
      );
    }

    // In a real app, upload file to cloud storage (S3, Cloudinary, etc.)
    // For hackathon, we'll store a mock URL
    const reportUrl = `/uploads/esg-reports/${fundId}/${file.name}`;

    const [report] = await db
      .insert(esgReports)
      .values({
        fundId,
        corporateId: corporate.id,
        reportUrl,
        reportName: file.name,
        reportYear,
      })
      .returning();

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Error uploading ESG report:', error);
    return NextResponse.json(
      { error: 'Failed to upload ESG report' },
      { status: 500 }
    );
  }
}
```

---

## Components

### InvitForm Component

```typescript
// src/components/forms/InvitForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { EsgUpload } from './EsgUpload';

interface InvitFormData {
  name: string;
  nav: string;
  minInvestment: string;
  fixedReturn: string;
  cagr1y: string;
  cagr2y: string;
  cagr3y: string;
  expenseRatio: string;
  launchDate: string;
  description: string;
}

export function InvitForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFundId, setCreatedFundId] = useState<string | null>(null);

  const [formData, setFormData] = useState<InvitFormData>({
    name: '',
    nav: '',
    minInvestment: '',
    fixedReturn: '',
    cagr1y: '',
    cagr2y: '',
    cagr3y: '',
    expenseRatio: '',
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

    try {
      const response = await fetch('/api/invits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nav: parseFloat(formData.nav),
          minInvestment: parseFloat(formData.minInvestment),
          fixedReturn: parseFloat(formData.fixedReturn),
          cagr1y: formData.cagr1y ? parseFloat(formData.cagr1y) : null,
          cagr2y: formData.cagr2y ? parseFloat(formData.cagr2y) : null,
          cagr3y: formData.cagr3y ? parseFloat(formData.cagr3y) : null,
          expenseRatio: formData.expenseRatio ? parseFloat(formData.expenseRatio) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create InvIT');
      }

      const data = await response.json();
      setCreatedFundId(data.invit.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEsgUploadComplete = () => {
    router.push('/invits');
  };

  const handleSkipEsg = () => {
    router.push('/invits');
  };

  // Show ESG upload step after InvIT is created
  if (createdFundId) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Upload ESG Report (Optional)
        </h2>
        <p className="text-[#8E8E93] text-sm mb-6">
          InvIT created successfully. You can now upload an ESG compliance report.
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
            label="InvIT Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter InvIT name"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the InvIT and its investment focus"
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
              label="NAV (in Rupees)"
              name="nav"
              type="number"
              step="0.01"
              value={formData.nav}
              onChange={handleChange}
              placeholder="100.00"
              required
            />

            <Input
              label="Min Investment (in Rupees)"
              name="minInvestment"
              type="number"
              step="0.01"
              value={formData.minInvestment}
              onChange={handleChange}
              placeholder="500.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fixed Return (%)"
              name="fixedReturn"
              type="number"
              step="0.01"
              value={formData.fixedReturn}
              onChange={handleChange}
              placeholder="8.5"
              required
            />

            <Input
              label="Expense Ratio (%)"
              name="expenseRatio"
              type="number"
              step="0.01"
              value={formData.expenseRatio}
              onChange={handleChange}
              placeholder="1.5"
            />
          </div>
        </div>

        {/* Historical Performance */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Historical Performance (CAGR)
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="1 Year (%)"
              name="cagr1y"
              type="number"
              step="0.01"
              value={formData.cagr1y}
              onChange={handleChange}
              placeholder="12.5"
            />

            <Input
              label="2 Years (%)"
              name="cagr2y"
              type="number"
              step="0.01"
              value={formData.cagr2y}
              onChange={handleChange}
              placeholder="10.2"
            />

            <Input
              label="3 Years (%)"
              name="cagr3y"
              type="number"
              step="0.01"
              value={formData.cagr3y}
              onChange={handleChange}
              placeholder="9.8"
            />
          </div>
        </div>

        {/* Launch Date */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Launch Details
          </h3>

          <Input
            label="Launch Date"
            name="launchDate"
            type="date"
            value={formData.launchDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating InvIT...' : 'Create InvIT'}
        </Button>
      </Card>
    </form>
  );
}
```

### EsgUpload Component

```typescript
// src/components/forms/EsgUpload.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { Input } from '@/components/ui/Input';

interface EsgUploadProps {
  fundId: string;
  onComplete?: () => void;
}

export function EsgUpload({ fundId, onComplete }: EsgUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('fundId', fundId);
      formData.append('file', file);
      formData.append('reportYear', reportYear);

      const response = await fetch('/api/esg-reports', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload ESG report');
      }

      setSuccess(true);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg p-4">
        <p className="text-[#22C55E] text-sm">
          ESG report uploaded successfully!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      <FileUpload
        label="ESG Report PDF"
        accept=".pdf"
        onChange={handleFileSelect}
        value={file}
      />

      <Input
        label="Report Year"
        type="number"
        min="2000"
        max="2030"
        value={reportYear}
        onChange={(e) => setReportYear(e.target.value)}
      />

      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full"
      >
        {loading ? 'Uploading...' : 'Upload ESG Report'}
      </Button>
    </div>
  );
}
```

### FundsTable Component

```typescript
// src/components/tables/FundsTable.tsx
'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface Fund {
  id: string;
  name: string;
  type: string;
  nav: string;
  fixedReturn: string;
  minInvestment: string;
  isActive: boolean;
  createdAt: string;
}

interface FundsTableProps {
  funds: Fund[];
  type: 'INVIT' | 'GREEN_BOND';
}

export function FundsTable({ funds, type }: FundsTableProps) {
  const typeLabel = type === 'INVIT' ? 'InvIT' : 'Green Bond';

  if (funds.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[#8E8E93] mb-4">
          No {typeLabel}s created yet
        </p>
        <Link href={type === 'INVIT' ? '/invits/create' : '/bonds/create'}>
          <Button>Create {typeLabel}</Button>
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
                NAV
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Fixed Return
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Min Investment
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
            {funds.map((fund) => (
              <tr
                key={fund.id}
                className="border-b border-[#2C2C2E] last:border-b-0 hover:bg-[#2C2C2E]/30"
              >
                <td className="px-4 py-4">
                  <span className="text-white font-medium">{fund.name}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-white">
                    Rs. {parseFloat(fund.nav).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-[#22C55E]">
                    {parseFloat(fund.fixedReturn).toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-[#8E8E93]">
                    Rs. {parseFloat(fund.minInvestment).toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      fund.isActive
                        ? 'bg-[#22C55E]/10 text-[#22C55E]'
                        : 'bg-[#8E8E93]/10 text-[#8E8E93]'
                    }`}
                  >
                    {fund.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={type === 'INVIT' ? `/invits/${fund.id}` : `/bonds/${fund.id}`}
                  >
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
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

### InvITs List Page

```typescript
// src/app/invits/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FundsTable } from '@/components/tables/FundsTable';

async function getInvits() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/invits`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.invits || [];
}

export default async function InvitsPage() {
  const invits = await getInvits();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">InvITs</h1>
          <p className="text-[#8E8E93] text-sm mt-1">
            Manage your Infrastructure Investment Trusts
          </p>
        </div>
        <Link href="/invits/create">
          <Button>Issue New InvIT</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1C1C1E] rounded-lg p-4">
          <p className="text-[#8E8E93] text-sm">Total InvITs</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {invits.length}
          </p>
        </div>
        <div className="bg-[#1C1C1E] rounded-lg p-4">
          <p className="text-[#8E8E93] text-sm">Active</p>
          <p className="text-2xl font-semibold text-[#22C55E] mt-1">
            {invits.filter((i: any) => i.isActive).length}
          </p>
        </div>
        <div className="bg-[#1C1C1E] rounded-lg p-4">
          <p className="text-[#8E8E93] text-sm">Avg. Fixed Return</p>
          <p className="text-2xl font-semibold text-[#3B82F6] mt-1">
            {invits.length > 0
              ? (
                  invits.reduce(
                    (sum: number, i: any) => sum + parseFloat(i.fixedReturn || 0),
                    0
                  ) / invits.length
                ).toFixed(2)
              : '0.00'}
            %
          </p>
        </div>
      </div>

      {/* Table */}
      <FundsTable funds={invits} type="INVIT" />
    </div>
  );
}
```

### Create InvIT Page

```typescript
// src/app/invits/create/page.tsx
import Link from 'next/link';
import { InvitForm } from '@/components/forms/InvitForm';

export default function CreateInvitPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/invits"
          className="text-[#3B82F6] text-sm hover:underline"
        >
          Back to InvITs
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">
          Issue New InvIT
        </h1>
        <p className="text-[#8E8E93] text-sm mt-1">
          Create an Infrastructure Investment Trust for investors
        </p>
      </div>

      {/* Form */}
      <InvitForm />
    </div>
  );
}
```

---

## Verification Steps

1. **List Page:** Navigate to `/invits` - should show empty state or list of InvITs
2. **Create InvIT:** Fill the form with all required fields and submit
3. **ESG Upload:** After creating, optionally upload an ESG report PDF
4. **View in Table:** New InvIT should appear in the list table
5. **Investor Visibility:** InvIT should be visible in Investors PWA under "Explore"

---

## Next Phase
[Phase 4: Create Green Bonds](./phase4.md)
