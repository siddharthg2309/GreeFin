# Phase 2: Home & Discover Pages

## Overview
Build the Home page with investment summary and explore carousel, plus the Discover page with fund search and listing.

**UI References:**
- Home: `docs/images/image copy.png`
- Discover: `docs/images/image copy 11.png`
- Search Results: `docs/images/image copy 2.png`
- Fund Detail: `docs/images/image copy 3.png`, `docs/images/image copy 4.png`
- Filters: `docs/images/image copy 10.png`

---

## 2.1 Funds API Routes

### Route: `GET /api/funds`
**File:** `src/app/api/funds/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds } from '@/db/schema';
import { eq, ilike, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // GREEN_BOND | INVIT | GREEN_FUND
    const search = searchParams.get('q');
    const minInvestment = searchParams.get('minInvestment');

    // Build query conditions
    const conditions = [eq(funds.isActive, true)];

    if (type) {
      conditions.push(eq(funds.type, type as any));
    }

    if (search) {
      conditions.push(ilike(funds.name, `%${search}%`));
    }

    // Execute query
    const result = await db
      .select()
      .from(funds)
      .where(and(...conditions))
      .orderBy(funds.name);

    // Filter by minInvestment in JS (for flexibility)
    let filteredResult = result;
    if (minInvestment) {
      const maxMin = parseFloat(minInvestment);
      filteredResult = result.filter(f => parseFloat(f.minInvestment) <= maxMin);
    }

    return NextResponse.json({
      success: true,
      data: filteredResult,
      count: filteredResult.length,
    });
  } catch (error) {
    console.error('Error fetching funds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funds' },
      { status: 500 }
    );
  }
}
```

---

### Route: `GET /api/funds/[id]`
**File:** `src/app/api/funds/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const [fund] = await db
      .select()
      .from(funds)
      .where(eq(funds.id, id))
      .limit(1);

    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }

    // Generate mock price history for chart
    const priceHistory = generateMockPriceHistory(parseFloat(fund.nav));

    return NextResponse.json({
      success: true,
      data: {
        ...fund,
        priceHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching fund:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fund' },
      { status: 500 }
    );
  }
}

// Generate mock price data for chart
function generateMockPriceHistory(currentNav: number) {
  const periods = ['3M', '6M', '1Y', '2Y', '3Y'];
  const history: Record<string, { date: string; price: number }[]> = {};

  periods.forEach(period => {
    const days = period === '3M' ? 90 : period === '6M' ? 180 : period === '1Y' ? 365 : period === '2Y' ? 730 : 1095;
    const volatility = 0.02; // 2% daily volatility
    const points: { date: string; price: number }[] = [];

    let price = currentNav * (1 - (Math.random() * 0.3)); // Start 0-30% lower

    for (let i = days; i >= 0; i -= Math.ceil(days / 30)) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Random walk towards current price
      const drift = (currentNav - price) / (i + 1) * 0.5;
      price += drift + (Math.random() - 0.5) * currentNav * volatility;
      price = Math.max(price, currentNav * 0.5); // Floor at 50% of current

      points.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
      });
    }

    // Ensure last point is current NAV
    points[points.length - 1].price = currentNav;
    history[period] = points;
  });

  return history;
}
```

---

### Route: `GET /api/funds/search`
**File:** `src/app/api/funds/search/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds } from '@/db/schema';
import { ilike, eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Search query must be at least 2 characters',
      });
    }

    const results = await db
      .select({
        id: funds.id,
        name: funds.name,
        type: funds.type,
        nav: funds.nav,
        minInvestment: funds.minInvestment,
        fixedReturn: funds.fixedReturn,
        cagr1y: funds.cagr1y,
      })
      .from(funds)
      .where(
        and(
          eq(funds.isActive, true),
          ilike(funds.name, `%${query}%`)
        )
      )
      .limit(20);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching funds:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

---

### Route: `GET /api/funds/type/[type]`
**File:** `src/app/api/funds/type/[type]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;

    // Validate type
    const validTypes = ['GREEN_BOND', 'INVIT', 'GREEN_FUND'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid fund type' },
        { status: 400 }
      );
    }

    const results = await db
      .select()
      .from(funds)
      .where(
        and(
          eq(funds.isActive, true),
          eq(funds.type, type as any)
        )
      )
      .orderBy(funds.name);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching funds by type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funds' },
      { status: 500 }
    );
  }
}
```

---

## 2.2 Portfolio Summary API

### Route: `GET /api/portfolio/summary`
**File:** `src/app/api/portfolio/summary/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holdings, funds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    // Get all holdings with fund details
    const userHoldings = await db
      .select({
        holding: holdings,
        fund: funds,
      })
      .from(holdings)
      .innerJoin(funds, eq(holdings.fundId, funds.id))
      .where(eq(holdings.userId, userId));

    if (userHoldings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalInvested: 0,
          currentValue: 0,
          totalPnl: 0,
          pnlPercent: 0,
          xirr: 0,
        },
      });
    }

    // Calculate totals
    let totalInvested = 0;
    let currentValue = 0;

    userHoldings.forEach(({ holding, fund }) => {
      const invested = parseFloat(holding.investedAmount);
      const current = parseFloat(holding.quantity) * parseFloat(fund.nav);

      totalInvested += invested;
      currentValue += current;
    });

    const totalPnl = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    // Mock XIRR calculation (simplified)
    const xirr = pnlPercent * 1.2; // Rough annualized estimate

    return NextResponse.json({
      success: true,
      data: {
        totalInvested: Math.round(totalInvested * 100) / 100,
        currentValue: Math.round(currentValue * 100) / 100,
        totalPnl: Math.round(totalPnl * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        xirr: Math.round(xirr * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
```

---

## 2.3 Impact Metrics API

### Route: `GET /api/impact`
**File:** `src/app/api/impact/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { impactMetrics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const [metrics] = await db
      .select()
      .from(impactMetrics)
      .where(eq(impactMetrics.userId, userId))
      .limit(1);

    if (!metrics) {
      // Return default metrics if none exist
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
        co2Avoided: parseFloat(metrics.co2Avoided || '0'),
        cleanEnergyGenerated: parseFloat(metrics.cleanEnergyGenerated || '0'),
        airQualityScore: parseFloat(metrics.airQualityScore || '0'),
        treesEquivalent: parseInt(metrics.treesEquivalent || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching impact metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch impact metrics' },
      { status: 500 }
    );
  }
}
```

---

## 2.4 Home Page Components

### File: `src/components/home/InvestmentCard.tsx`

```typescript
'use client';

import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface InvestmentCardProps {
  totalInvested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  xirr: number;
}

export function InvestmentCard({
  totalInvested,
  currentValue,
  pnl,
  pnlPercent,
  xirr,
}: InvestmentCardProps) {
  const isPositive = pnl >= 0;

  return (
    <Card className="bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
          Your investments
        </span>
        <Link href="/investments" className="text-blue-500 text-sm flex items-center gap-1">
          View <RefreshCw className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">P&L</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-white' : 'text-red-500'}`}>
            {formatCurrency(pnl)}
          </p>
          <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(pnlPercent)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">XIRR</p>
          <p className={`text-sm ${xirr >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(xirr)}
          </p>
        </div>
      </div>

      <div className="flex justify-between border-t border-gray-800 pt-4">
        <div>
          <p className="text-xs text-gray-500">Invested</p>
          <p className="text-lg">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Current</p>
          <p className="text-lg">{formatCurrency(currentValue)}</p>
        </div>
      </div>
    </Card>
  );
}
```

---

### File: `src/components/home/ExploreCarousel.tsx`

```typescript
'use client';

import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Leaf, Building, TrendingUp } from 'lucide-react';

const categories = [
  {
    id: 'GREEN_FUND',
    title: 'Green Mutual Funds',
    description: 'ESG & renewable energy funds',
    icon: Leaf,
    color: 'bg-green-500/20 text-green-500',
  },
  {
    id: 'GREEN_BOND',
    title: 'Green Bonds',
    description: 'Fixed return green bonds',
    icon: Building,
    color: 'bg-blue-500/20 text-blue-500',
  },
  {
    id: 'INVIT',
    title: 'Green InvITs',
    description: 'Infrastructure trusts',
    icon: TrendingUp,
    color: 'bg-purple-500/20 text-purple-500',
  },
];

export function ExploreCarousel() {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Explore investment ideas</h2>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {categories.map(({ id, title, description, icon: Icon, color }) => (
          <Link key={id} href={`/discover?type=${id}`}>
            <Card className="min-w-[200px] hover:bg-gray-800 transition-colors">
              <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-medium mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-2">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <div className="w-2 h-2 rounded-full bg-gray-600" />
        <div className="w-2 h-2 rounded-full bg-gray-600" />
      </div>
    </div>
  );
}
```

---

### File: `src/components/home/ImpactMetrics.tsx`

```typescript
'use client';

import { Card } from '@/components/ui/Card';
import { Cloud, Wind, TreePine } from 'lucide-react';

interface ImpactMetricsProps {
  co2Avoided: number;
  cleanEnergyGenerated: number;
  treesEquivalent: number;
}

export function ImpactMetrics({
  co2Avoided,
  cleanEnergyGenerated,
  treesEquivalent,
}: ImpactMetricsProps) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Your Impact</h2>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <Cloud className="w-6 h-6 mx-auto mb-2 text-blue-400" />
          <p className="text-lg font-bold">{co2Avoided.toFixed(1)}</p>
          <p className="text-xs text-gray-500">kg CO₂ avoided</p>
        </Card>

        <Card className="text-center py-4">
          <Wind className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <p className="text-lg font-bold">{cleanEnergyGenerated.toFixed(0)}</p>
          <p className="text-xs text-gray-500">kWh clean energy</p>
        </Card>

        <Card className="text-center py-4">
          <TreePine className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
          <p className="text-lg font-bold">{treesEquivalent}</p>
          <p className="text-xs text-gray-500">trees equivalent</p>
        </Card>
      </div>
    </div>
  );
}
```

---

## 2.5 Home Page

### File: `src/app/page.tsx`

```typescript
import { Search } from 'lucide-react';
import Link from 'next/link';
import { InvestmentCard } from '@/components/home/InvestmentCard';
import { ExploreCarousel } from '@/components/home/ExploreCarousel';
import { ImpactMetrics } from '@/components/home/ImpactMetrics';
import { mockUser } from '@/lib/mock-user';

async function getPortfolioSummary() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/portfolio/summary`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

async function getImpactMetrics() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/impact`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export default async function HomePage() {
  const [portfolio, impact] = await Promise.all([
    getPortfolioSummary(),
    getImpactMetrics(),
  ]);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-full" />
          <div>
            <h1 className="text-lg font-semibold">Hi {mockUser.name.split(' ')[0]}</h1>
            <p className="text-sm text-gray-500">Welcome to GreenFin</p>
          </div>
        </div>
        <Link href="/discover" className="p-2">
          <Search className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Investment Summary */}
      {portfolio && (
        <InvestmentCard
          totalInvested={portfolio.totalInvested}
          currentValue={portfolio.currentValue}
          pnl={portfolio.totalPnl}
          pnlPercent={portfolio.pnlPercent}
          xirr={portfolio.xirr}
        />
      )}

      {/* Explore Categories */}
      <ExploreCarousel />

      {/* Impact Metrics */}
      {impact && (
        <ImpactMetrics
          co2Avoided={impact.co2Avoided}
          cleanEnergyGenerated={impact.cleanEnergyGenerated}
          treesEquivalent={impact.treesEquivalent}
        />
      )}
    </div>
  );
}
```

---

## 2.6 Discover Page Components

### File: `src/components/discover/SearchBar.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface SearchBarProps {
  defaultValue?: string;
  onFilterClick?: () => void;
}

export function SearchBar({ defaultValue = '', onFilterClick }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/discover?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search green funds..."
          className="pl-10"
        />
      </div>
      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          className="p-2 bg-gray-800 rounded-lg"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}
```

---

### File: `src/components/discover/FundCard.tsx`

```typescript
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { Fund } from '@/db/schema';

interface FundCardProps {
  fund: Fund;
}

export function FundCard({ fund }: FundCardProps) {
  const displayReturn = fund.type === 'GREEN_FUND'
    ? fund.cagr1y
    : fund.fixedReturn;

  const returnLabel = fund.type === 'GREEN_FUND' ? '1Y CAGR' : 'Fixed Return';

  return (
    <Link href={`/discover/fund/${fund.id}`}>
      <Card className="hover:bg-gray-800 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{fund.name}</h3>
            <p className="text-sm text-gray-500">
              {fund.type === 'GREEN_FUND' ? 'Green Fund' :
               fund.type === 'GREEN_BOND' ? 'Green Bond' : 'InvIT'}
            </p>
          </div>

          <div className="text-right">
            {displayReturn && (
              <p className="text-green-500 font-medium">
                {formatPercent(parseFloat(displayReturn))}
              </p>
            )}
            <p className="text-xs text-gray-500">{returnLabel}</p>
          </div>
        </div>

        <div className="flex justify-between mt-3 pt-3 border-t border-gray-800">
          <div>
            <p className="text-xs text-gray-500">NAV</p>
            <p className="text-sm">{formatCurrency(fund.nav)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Min. Investment</p>
            <p className="text-sm">{formatCurrency(fund.minInvestment)}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

---

### File: `src/components/discover/FundTypeGrid.tsx`

```typescript
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Leaf, Building, TrendingUp } from 'lucide-react';

const fundTypes = [
  {
    id: 'GREEN_FUND',
    name: 'Green Funds',
    icon: Leaf,
    color: 'bg-green-500',
  },
  {
    id: 'GREEN_BOND',
    name: 'Green Bonds',
    icon: Building,
    color: 'bg-blue-500',
  },
  {
    id: 'INVIT',
    name: 'InvITs',
    icon: TrendingUp,
    color: 'bg-purple-500',
  },
];

export function FundTypeGrid() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Get started</p>
      <p className="text-base">Find the right fund across these categories</p>

      <div className="space-y-3 mt-4">
        {fundTypes.map(({ id, name, icon: Icon, color }) => (
          <Link key={id} href={`/discover?type=${id}`}>
            <Card className="flex items-center gap-4 hover:bg-gray-800 transition-colors">
              <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium">{name}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## 2.7 Discover Page

### File: `src/app/discover/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/discover/SearchBar';
import { FundCard } from '@/components/discover/FundCard';
import { FundTypeGrid } from '@/components/discover/FundTypeGrid';
import type { Fund } from '@/db/schema';

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const type = searchParams.get('type');

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'watchlist'>('explore');

  useEffect(() => {
    if (query || type) {
      fetchFunds();
    }
  }, [query, type]);

  async function fetchFunds() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (type) params.set('type', type);

      const res = await fetch(`/api/funds?${params}`);
      const data = await res.json();

      if (data.success) {
        setFunds(data.data);
      }
    } catch (error) {
      console.error('Error fetching funds:', error);
    } finally {
      setLoading(false);
    }
  }

  const showResults = query || type;

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-6 mb-6">
        <button
          onClick={() => setActiveTab('explore')}
          className={`pb-2 font-medium ${
            activeTab === 'explore'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`pb-2 font-medium ${
            activeTab === 'watchlist'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
        >
          Watchlist
        </button>
      </div>

      {/* Search Bar */}
      <SearchBar defaultValue={query || ''} onFilterClick={() => {}} />

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'explore' ? (
          showResults ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {funds.length} results
                {type && ` for ${type.replace('_', ' ').toLowerCase()}`}
              </p>

              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="space-y-4">
                  {funds.map((fund) => (
                    <FundCard key={fund.id} fund={fund} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <FundTypeGrid />
          )
        ) : (
          <WatchlistSection />
        )}
      </div>
    </div>
  );
}

function WatchlistSection() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  async function fetchWatchlist() {
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      if (data.success) {
        setWatchlist(data.data);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading watchlist...</p>;
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No funds in your watchlist</p>
        <p className="text-sm text-gray-600 mt-2">
          Add funds to track them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {watchlist.map((item) => (
        <FundCard key={item.fund.id} fund={item.fund} />
      ))}
    </div>
  );
}
```

---

## 2.8 Fund Detail Page

### File: `src/app/discover/fund/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { FundHeader } from '@/components/fund/FundHeader';
import { PriceChart } from '@/components/fund/PriceChart';
import { FundActions } from '@/components/fund/FundActions';
import { formatCurrency, formatPercent } from '@/lib/utils';

async function getFund(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/funds/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export default async function FundDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const fund = await getFund(params.id);

  if (!fund) {
    notFound();
  }

  return (
    <div className="pb-24">
      <FundHeader fund={fund} />

      {/* NAV Section */}
      <div className="p-4">
        <p className="text-sm text-gray-500">
          Current NAV ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-500">
            {formatCurrency(fund.nav)}
          </span>
          {fund.cagr1y && (
            <span className="text-green-500">
              {formatPercent(parseFloat(fund.cagr1y))}
            </span>
          )}
        </div>
      </div>

      {/* CAGR & Details */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Min. Investment</p>
          <p className="font-medium">{formatCurrency(fund.minInvestment)}</p>
        </div>
        {fund.expenseRatio && (
          <div>
            <p className="text-sm text-gray-500">Expense Ratio</p>
            <p className="font-medium">{fund.expenseRatio}%</p>
          </div>
        )}
        {fund.fixedReturn && (
          <div>
            <p className="text-sm text-gray-500">Fixed Return</p>
            <p className="font-medium text-green-500">{fund.fixedReturn}%</p>
          </div>
        )}
        {fund.launchDate && (
          <div>
            <p className="text-sm text-gray-500">Launched on</p>
            <p className="font-medium">
              {new Date(fund.launchDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Price Chart */}
      {fund.priceHistory && (
        <PriceChart priceHistory={fund.priceHistory} />
      )}

      {/* Buy/SIP Actions */}
      <FundActions fund={fund} />
    </div>
  );
}
```

---

## Phase 2 Checklist

- [ ] Create `/api/funds` route (list all, filter)
- [ ] Create `/api/funds/[id]` route (fund detail)
- [ ] Create `/api/funds/search` route (search)
- [ ] Create `/api/funds/type/[type]` route (by type)
- [ ] Create `/api/portfolio/summary` route
- [ ] Create `/api/impact` route
- [ ] Create InvestmentCard component
- [ ] Create ExploreCarousel component
- [ ] Create ImpactMetrics component
- [ ] Create Home page
- [ ] Create SearchBar component
- [ ] Create FundCard component
- [ ] Create FundTypeGrid component
- [ ] Create Discover page with tabs
- [ ] Create Fund Detail page
- [ ] Create FundHeader component
- [ ] Create PriceChart component (mock)

---

## Next: [Phase 3 - Transactions](./phase3.md)
