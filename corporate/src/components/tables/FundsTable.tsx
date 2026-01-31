'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface FundRow {
  id: string;
  name: string;
  nav: string;
  fixedReturn: string | null;
  minInvestment: string;
  isActive: boolean | null;
  createdAt: string | Date | null;
}

interface FundsTableProps {
  funds: FundRow[];
  type: 'INVIT' | 'GREEN_BOND';
}

export function FundsTable({ funds, type }: FundsTableProps) {
  const typeLabel = type === 'INVIT' ? 'InvIT' : 'Green Bond';

  if (funds.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[#8E8E93] mb-4">No {typeLabel}s created yet</p>
        <Link href={type === 'INVIT' ? '/invits/create' : '/bonds/create'}>
          <Button>Create {typeLabel}</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2C2C2E]">
              <th className="text-left text-[#8E8E93] text-sm font-medium px-4 py-3">Name</th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">NAV</th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Fixed Return
              </th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">
                Min Investment
              </th>
              <th className="text-center text-[#8E8E93] text-sm font-medium px-4 py-3">Status</th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">Actions</th>
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
                    Rs.{' '}
                    {Number.parseFloat(fund.nav).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  {fund.fixedReturn ? (
                    <span className="text-[#22C55E]">
                      {Number.parseFloat(fund.fixedReturn).toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-[#8E8E93]">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-[#8E8E93]">
                    Rs. {Number.parseFloat(fund.minInvestment).toLocaleString('en-IN')}
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
                  <Link href={type === 'INVIT' ? `/invits/${fund.id}` : `/bonds/${fund.id}`}>
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

