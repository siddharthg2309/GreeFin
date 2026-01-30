import Link from 'next/link';

import { RedemptionsTable } from '@/components/tables/RedemptionsTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getBaseUrl } from '@/lib/get-base-url';

type Allocation = {
  id: string;
  totalAmount: string;
  remainingAmount: string;
  description: string | null;
  status: 'ACTIVE' | 'EXHAUSTED' | 'PAUSED' | string;
  createdAt: string;
};

type Stats = {
  totalAllocated: number;
  totalRemaining: number;
  totalUtilized: number;
  utilizationPercent: string;
  activeCount: number;
  exhaustedCount: number;
  redemptionCount: number;
  totalCreditsRedeemed: number;
};

type Redemption = {
  id: string;
  userName: string;
  userEmail: string;
  productName: string | null;
  productPrice: string | null;
  creditsRedeemed: string | null;
  status: string;
  createdAt: string;
  processedAt: string | null;
};

async function getCsrData(): Promise<{
  allocations: Allocation[];
  stats: Stats;
  redemptions: Redemption[];
}> {
  const baseUrl = await getBaseUrl();

  const [allocationsRes, statsRes, redemptionsRes] = await Promise.all([
    fetch(new URL('/api/csr-funds', baseUrl), { cache: 'no-store' }),
    fetch(new URL('/api/csr-funds/stats', baseUrl), { cache: 'no-store' }),
    fetch(new URL('/api/csr-funds/redemptions', baseUrl), { cache: 'no-store' }),
  ]);

  const allocations = allocationsRes.ok
    ? (((await allocationsRes.json()) as { data?: Allocation[] }).data ?? [])
    : [];

  const stats = statsRes.ok
    ? (((await statsRes.json()) as { data?: Stats }).data ?? null)
    : null;

  const redemptions = redemptionsRes.ok
    ? (((await redemptionsRes.json()) as { data?: Redemption[] }).data ?? [])
    : [];

  return {
    allocations,
    stats: stats ?? {
      totalAllocated: 0,
      totalRemaining: 0,
      totalUtilized: 0,
      utilizationPercent: '0.0',
      activeCount: 0,
      exhaustedCount: 0,
      redemptionCount: 0,
      totalCreditsRedeemed: 0,
    },
    redemptions,
  };
}

export default async function CsrFundsPage() {
  const { allocations, stats, redemptions } = await getCsrData();

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className="text-[#8E8E93] text-xs mt-1">{stats.utilizationPercent}% of total</p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Redemptions</p>
          <p className="text-2xl font-semibold text-white mt-1">{stats.redemptionCount}</p>
          <p className="text-[#8E8E93] text-xs mt-1">
            Rs. {stats.totalCreditsRedeemed.toLocaleString('en-IN')} in credits
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#8E8E93] text-sm">Fund Utilization</span>
          <span className="text-white text-sm font-medium">{stats.utilizationPercent}%</span>
        </div>
        <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#22C55E] rounded-full transition-all"
            style={{ width: `${Math.min(Number.parseFloat(stats.utilizationPercent), 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-[#8E8E93]">
          <span>{stats.activeCount} active allocation(s)</span>
          <span>{stats.exhaustedCount} exhausted</span>
        </div>
      </Card>

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
            {allocations.map((allocation) => {
              const total = Number.parseFloat(allocation.totalAmount || '0') || 0;
              const remaining = Number.parseFloat(allocation.remainingAmount || '0') || 0;
              const utilized = Math.max(0, total - remaining);
              const pct = total > 0 ? (utilized / total) * 100 : 0;

              return (
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
                      {allocation.description && <p className="text-white mt-1">{allocation.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">Rs. {remaining.toLocaleString('en-IN')}</p>
                      <p className="text-[#8E8E93] text-xs">of Rs. {total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1 bg-[#2C2C2E] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Redemptions</h2>
        <RedemptionsTable redemptions={redemptions} />
      </div>
    </div>
  );
}
