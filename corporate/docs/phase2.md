# Phase 2: Dashboard & Impact Metrics

## Overview
Build the main dashboard showing corporate statistics, issued instruments summary, and aggregated impact metrics.

---

## 2.1 Dashboard API

### Route: `GET /api/dashboard`
**File:** `src/app/api/dashboard/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds, orders, csrFundings, greenCreditClaims } from '@/db/schema';
import { eq, and, sum, count } from 'drizzle-orm';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    // Get InvITs issued by this corporate
    const invitsData = await db
      .select({
        count: count(),
        totalNav: sum(funds.nav),
      })
      .from(funds)
      .where(
        and(
          eq(funds.issuerId, corporateId),
          eq(funds.type, 'INVIT'),
          eq(funds.isActive, true)
        )
      );

    // Get Green Bonds issued by this corporate
    const bondsData = await db
      .select({
        count: count(),
        totalNav: sum(funds.nav),
      })
      .from(funds)
      .where(
        and(
          eq(funds.issuerId, corporateId),
          eq(funds.type, 'GREEN_BOND'),
          eq(funds.isActive, true)
        )
      );

    // Get CSR funding stats
    const csrData = await db
      .select({
        totalAllocated: sum(csrFundings.totalAmount),
        totalRemaining: sum(csrFundings.remainingAmount),
      })
      .from(csrFundings)
      .where(eq(csrFundings.corporateId, corporateId));

    // Get total investments in corporate's funds
    const investmentsData = await db
      .select({
        totalAmount: sum(orders.amount),
        totalOrders: count(),
      })
      .from(orders)
      .innerJoin(funds, eq(orders.fundId, funds.id))
      .where(
        and(
          eq(funds.issuerId, corporateId),
          eq(orders.status, 'COMPLETED')
        )
      );

    // Get recent credit redemptions funded by this corporate's CSR
    const recentRedemptions = await db
      .select({
        count: count(),
        totalRedeemed: sum(greenCreditClaims.creditsRedeemed),
      })
      .from(greenCreditClaims)
      .innerJoin(csrFundings, eq(greenCreditClaims.csrFundingId, csrFundings.id))
      .where(
        and(
          eq(csrFundings.corporateId, corporateId),
          eq(greenCreditClaims.status, 'APPROVED')
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        invits: {
          count: invitsData[0]?.count || 0,
          totalValue: parseFloat(invitsData[0]?.totalNav || '0'),
        },
        bonds: {
          count: bondsData[0]?.count || 0,
          totalValue: parseFloat(bondsData[0]?.totalNav || '0'),
        },
        csr: {
          totalAllocated: parseFloat(csrData[0]?.totalAllocated || '0'),
          totalRemaining: parseFloat(csrData[0]?.totalRemaining || '0'),
          utilized: parseFloat(csrData[0]?.totalAllocated || '0') - parseFloat(csrData[0]?.totalRemaining || '0'),
        },
        investments: {
          totalAmount: parseFloat(investmentsData[0]?.totalAmount || '0'),
          totalOrders: investmentsData[0]?.totalOrders || 0,
        },
        redemptions: {
          count: recentRedemptions[0]?.count || 0,
          totalRedeemed: parseFloat(recentRedemptions[0]?.totalRedeemed || '0'),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
```

---

### Route: `GET /api/impact`
**File:** `src/app/api/impact/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { funds, orders, impactMetrics } from '@/db/schema';
import { eq, and, sum } from 'drizzle-orm';
import { getCurrentCorporateId } from '@/lib/mock-corporate';

export async function GET() {
  try {
    const corporateId = getCurrentCorporateId();

    // Get total investments in corporate's funds
    const investmentData = await db
      .select({
        totalAmount: sum(orders.amount),
      })
      .from(orders)
      .innerJoin(funds, eq(orders.fundId, funds.id))
      .where(
        and(
          eq(funds.issuerId, corporateId),
          eq(orders.status, 'COMPLETED')
        )
      );

    const totalInvestment = parseFloat(investmentData[0]?.totalAmount || '0');

    // Calculate mock impact metrics based on investment amount
    // These are illustrative calculations
    const co2Avoided = totalInvestment * 0.0001; // 0.1 kg CO2 per ₹1000 invested
    const cleanEnergyGenerated = totalInvestment * 0.0005; // 0.5 kWh per ₹1000
    const treesEquivalent = Math.floor(totalInvestment / 50000); // 1 tree per ₹50,000
    const homesPoered = Math.floor(cleanEnergyGenerated / 300); // 300 kWh per home/month

    return NextResponse.json({
      success: true,
      data: {
        co2Avoided: Math.round(co2Avoided * 100) / 100,
        cleanEnergyGenerated: Math.round(cleanEnergyGenerated * 100) / 100,
        treesEquivalent,
        homesPoered,
        totalInvestment,
        sdgAlignment: {
          sdg7: 85, // Affordable & Clean Energy
          sdg9: 78, // Industry, Innovation & Infrastructure
          sdg13: 72, // Climate Action
        },
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

## 2.2 Dashboard Components

### File: `src/components/dashboard/StatCard.tsx`

```typescript
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-500',
  trend,
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#8E8E93]">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-[#8E8E93] mt-1">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-sm mt-2',
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg bg-[#121212]', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
```

### File: `src/components/dashboard/ImpactMetrics.tsx`

```typescript
import { Card } from '@/components/ui/Card';
import { Cloud, Zap, TreePine, Home } from 'lucide-react';

interface ImpactMetricsProps {
  co2Avoided: number;
  cleanEnergyGenerated: number;
  treesEquivalent: number;
  homesPowered: number;
}

export function ImpactMetrics({
  co2Avoided,
  cleanEnergyGenerated,
  treesEquivalent,
  homesPowered,
}: ImpactMetricsProps) {
  const metrics = [
    {
      icon: Cloud,
      value: `${co2Avoided.toLocaleString()} kg`,
      label: 'CO₂ Avoided',
      color: 'text-blue-400',
    },
    {
      icon: Zap,
      value: `${cleanEnergyGenerated.toLocaleString()} kWh`,
      label: 'Clean Energy',
      color: 'text-yellow-400',
    },
    {
      icon: TreePine,
      value: treesEquivalent.toLocaleString(),
      label: 'Trees Equivalent',
      color: 'text-green-400',
    },
    {
      icon: Home,
      value: homesPowered.toLocaleString(),
      label: 'Homes Powered',
      color: 'text-purple-400',
    },
  ];

  return (
    <Card>
      <h3 className="text-lg font-medium mb-4">Environmental Impact</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="text-center p-4 bg-[#121212] rounded-lg">
            <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
            <p className="text-xl font-semibold">{value}</p>
            <p className="text-sm text-[#8E8E93]">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

### File: `src/components/dashboard/CsrProgress.tsx`

```typescript
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface CsrProgressProps {
  totalAllocated: number;
  utilized: number;
  remaining: number;
}

export function CsrProgress({ totalAllocated, utilized, remaining }: CsrProgressProps) {
  const utilizationPercent = totalAllocated > 0
    ? (utilized / totalAllocated) * 100
    : 0;

  return (
    <Card>
      <h3 className="text-lg font-medium mb-4">CSR Fund Utilization</h3>

      <div className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#8E8E93]">Utilized</span>
            <span>{utilizationPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-[#121212] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2C2C2E]">
          <div>
            <p className="text-sm text-[#8E8E93]">Total Allocated</p>
            <p className="text-lg font-semibold">{formatCurrency(totalAllocated)}</p>
          </div>
          <div>
            <p className="text-sm text-[#8E8E93]">Utilized</p>
            <p className="text-lg font-semibold text-green-500">{formatCurrency(utilized)}</p>
          </div>
          <div>
            <p className="text-sm text-[#8E8E93]">Remaining</p>
            <p className="text-lg font-semibold text-blue-500">{formatCurrency(remaining)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

### File: `src/components/dashboard/RecentActivity.tsx`

```typescript
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, FileText, Wallet, CheckCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'invit_created' | 'bond_created' | 'csr_allocated' | 'credit_redeemed';
  title: string;
  amount?: number;
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  invit_created: TrendingUp,
  bond_created: FileText,
  csr_allocated: Wallet,
  credit_redeemed: CheckCircle,
};

const activityColors = {
  invit_created: 'text-purple-500 bg-purple-500/10',
  bond_created: 'text-blue-500 bg-blue-500/10',
  csr_allocated: 'text-green-500 bg-green-500/10',
  credit_redeemed: 'text-yellow-500 bg-yellow-500/10',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <h3 className="text-lg font-medium mb-4">Recent Activity</h3>

      {activities.length === 0 ? (
        <p className="text-[#8E8E93] text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div key={activity.id} className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.title}</p>
                  <p className="text-xs text-[#8E8E93]">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
                {activity.amount && (
                  <p className="text-sm font-medium">
                    {formatCurrency(activity.amount)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
```

---

## 2.3 Dashboard Page

### File: `src/app/page.tsx`

```typescript
import { StatCard } from '@/components/dashboard/StatCard';
import { ImpactMetrics } from '@/components/dashboard/ImpactMetrics';
import { CsrProgress } from '@/components/dashboard/CsrProgress';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { TrendingUp, FileText, Wallet, ShoppingBag } from 'lucide-react';

async function getDashboardData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/dashboard`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

async function getImpactData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/impact`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export default async function DashboardPage() {
  const [dashboard, impact] = await Promise.all([
    getDashboardData(),
    getImpactData(),
  ]);

  // Mock recent activities
  const recentActivities = [
    {
      id: '1',
      type: 'invit_created' as const,
      title: 'Created PowerGrid Green InvIT',
      amount: 10000000,
      timestamp: '2026-01-28',
    },
    {
      id: '2',
      type: 'csr_allocated' as const,
      title: 'Allocated CSR funds for Q4',
      amount: 2500000,
      timestamp: '2026-01-25',
    },
    {
      id: '3',
      type: 'credit_redeemed' as const,
      title: 'Green credit redeemed by user',
      amount: 15000,
      timestamp: '2026-01-24',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-[#8E8E93] mt-1">
          Overview of your green investment instruments
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="InvITs Issued"
          value={dashboard?.invits.count || 0}
          subtitle={formatCurrency(dashboard?.invits.totalValue || 0)}
          icon={TrendingUp}
          iconColor="text-purple-500"
        />
        <StatCard
          title="Green Bonds"
          value={dashboard?.bonds.count || 0}
          subtitle={formatCurrency(dashboard?.bonds.totalValue || 0)}
          icon={FileText}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Total Investments"
          value={formatCurrency(dashboard?.investments.totalAmount || 0)}
          subtitle={`${formatNumber(dashboard?.investments.totalOrders || 0)} orders`}
          icon={ShoppingBag}
          iconColor="text-green-500"
        />
        <StatCard
          title="Credits Redeemed"
          value={formatCurrency(dashboard?.redemptions.totalRedeemed || 0)}
          subtitle={`${dashboard?.redemptions.count || 0} redemptions`}
          icon={Wallet}
          iconColor="text-yellow-500"
        />
      </div>

      {/* Impact Metrics */}
      {impact && (
        <ImpactMetrics
          co2Avoided={impact.co2Avoided}
          cleanEnergyGenerated={impact.cleanEnergyGenerated}
          treesEquivalent={impact.treesEquivalent}
          homesPowered={impact.homesPoered}
        />
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSR Progress */}
        {dashboard && (
          <CsrProgress
            totalAllocated={dashboard.csr.totalAllocated}
            utilized={dashboard.csr.utilized}
            remaining={dashboard.csr.totalRemaining}
          />
        )}

        {/* Recent Activity */}
        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
}
```

---

## Phase 2 Checklist

- [ ] Create `/api/dashboard` route
- [ ] Create `/api/impact` route
- [ ] Create StatCard component
- [ ] Create ImpactMetrics component
- [ ] Create CsrProgress component
- [ ] Create RecentActivity component
- [ ] Create Dashboard page
- [ ] Test dashboard data fetching
- [ ] Verify impact calculations
- [ ] Style and polish UI

---

## Next: [Phase 3 - Issue InvITs](./phase3.md)
