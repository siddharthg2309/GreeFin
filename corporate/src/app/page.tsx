import { FileText, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';

import { CsrProgress } from '@/components/dashboard/CsrProgress';
import { ImpactMetrics } from '@/components/dashboard/ImpactMetrics';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { StatCard } from '@/components/dashboard/StatCard';
import { getBaseUrl } from '@/lib/get-base-url';
import { formatCurrency, formatNumber } from '@/lib/utils';

type DashboardResponse = {
  invits: { count: number; totalValue: number };
  bonds: { count: number; totalValue: number };
  csr: { totalAllocated: number; totalRemaining: number; utilized: number };
  investments: { totalAmount: number; totalOrders: number };
  redemptions: { count: number; totalRedeemed: number };
};

type ImpactResponse = {
  co2Avoided: number;
  cleanEnergyGenerated: number;
  treesEquivalent: number;
  homesPowered: number;
};

async function getDashboardData(baseUrl: string): Promise<DashboardResponse | null> {
  const res = await fetch(new URL('/api/dashboard', baseUrl), { cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: DashboardResponse };
  return json.data ?? null;
}

async function getImpactData(baseUrl: string): Promise<ImpactResponse | null> {
  const res = await fetch(new URL('/api/impact', baseUrl), { cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: ImpactResponse };
  return json.data ?? null;
}

export default async function DashboardPage() {
  const baseUrl = await getBaseUrl();
  const [dashboard, impact] = await Promise.all([getDashboardData(baseUrl), getImpactData(baseUrl)]);

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
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-[#8E8E93] mt-1">Overview of your green investment instruments</p>
      </div>

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

      {impact && (
        <ImpactMetrics
          co2Avoided={impact.co2Avoided}
          cleanEnergyGenerated={impact.cleanEnergyGenerated}
          treesEquivalent={impact.treesEquivalent}
          homesPowered={impact.homesPowered}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboard && (
          <CsrProgress
            totalAllocated={dashboard.csr.totalAllocated}
            utilized={dashboard.csr.utilized}
            remaining={dashboard.csr.totalRemaining}
          />
        )}
        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
}
