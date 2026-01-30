import Link from 'next/link';

import { BondsTable } from '@/components/tables/BondsTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getBaseUrl } from '@/lib/get-base-url';

type BondRow = {
  id: string;
  name: string;
  nav: string;
  minInvestment: string;
  fixedReturn: string | null;
  maturityDate: string | null;
  isActive: boolean | null;
};

async function getBonds(): Promise<BondRow[]> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(new URL('/api/bonds', baseUrl), { cache: 'no-store' });
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: BondRow[] };
  return json.data ?? [];
}

export default async function BondsPage() {
  const bonds = await getBonds();

  const activeCount = bonds.filter((b) => b.isActive).length;
  const avgCoupon =
    bonds.length > 0
      ? bonds.reduce((sum, b) => sum + Number.parseFloat(b.fixedReturn || '0'), 0) / bonds.length
      : 0;
  const totalValue = bonds.reduce((sum, b) => sum + Number.parseFloat(b.nav || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Green Bonds</h1>
          <p className="text-[#8E8E93] text-sm mt-1">Manage your Green Bond instruments</p>
        </div>
        <Link href="/bonds/create">
          <Button>Create Green Bond</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Total Bonds</p>
          <p className="text-2xl font-semibold text-white mt-1">{bonds.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Active Bonds</p>
          <p className="text-2xl font-semibold text-[#22C55E] mt-1">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Avg. Coupon Rate</p>
          <p className="text-2xl font-semibold text-[#3B82F6] mt-1">{avgCoupon.toFixed(2)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8E8E93] text-sm">Total Issue Value</p>
          <p className="text-2xl font-semibold text-white mt-1">Rs. {totalValue.toLocaleString('en-IN')}</p>
        </Card>
      </div>

      <BondsTable bonds={bonds} />
    </div>
  );
}
