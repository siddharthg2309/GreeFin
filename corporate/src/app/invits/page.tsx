import Link from 'next/link';

import { FundsTable } from '@/components/tables/FundsTable';
import { Button } from '@/components/ui/Button';
import { getBaseUrl } from '@/lib/get-base-url';

type InvitRow = {
  id: string;
  name: string;
  nav: string;
  fixedReturn: string | null;
  minInvestment: string;
  isActive: boolean | null;
  createdAt: string | Date | null;
};

async function getInvits(): Promise<InvitRow[]> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(new URL('/api/invits', baseUrl), { cache: 'no-store' });
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: InvitRow[] };
  return json.data ?? [];
}

export default async function InvitsPage() {
  const invits = await getInvits();

  const activeCount = invits.filter((i) => i.isActive).length;
  const avgFixedReturn =
    invits.length > 0
      ? invits.reduce((sum, i) => sum + Number.parseFloat(i.fixedReturn || '0'), 0) / invits.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">InvITs</h1>
          <p className="text-[#8E8E93] text-sm mt-1">Manage your Infrastructure Investment Trusts</p>
        </div>
        <Link href="/invits/create">
          <Button>Issue New InvIT</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1C1C1E] rounded-lg p-4 border border-[#2C2C2E]">
          <p className="text-[#8E8E93] text-sm">Total InvITs</p>
          <p className="text-2xl font-semibold text-white mt-1">{invits.length}</p>
        </div>
        <div className="bg-[#1C1C1E] rounded-lg p-4 border border-[#2C2C2E]">
          <p className="text-[#8E8E93] text-sm">Active</p>
          <p className="text-2xl font-semibold text-[#22C55E] mt-1">{activeCount}</p>
        </div>
        <div className="bg-[#1C1C1E] rounded-lg p-4 border border-[#2C2C2E]">
          <p className="text-[#8E8E93] text-sm">Avg. Fixed Return</p>
          <p className="text-2xl font-semibold text-[#3B82F6] mt-1">{avgFixedReturn.toFixed(2)}%</p>
        </div>
      </div>

      <FundsTable funds={invits} type="INVIT" />
    </div>
  );
}
