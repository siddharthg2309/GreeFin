'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type BondRow = {
  id: string;
  name: string;
  nav: string;
  fixedReturn: string | null;
  maturityDate: string | null;
  isActive: boolean | null;
};

export function BondsTable({ bonds }: { bonds: BondRow[] }) {
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
    <Card className="overflow-hidden" padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2C2C2E]">
              <th className="text-left text-[#8E8E93] text-sm font-medium px-4 py-3">Name</th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">Face Value</th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">Coupon Rate</th>
              <th className="text-center text-[#8E8E93] text-sm font-medium px-4 py-3">Maturity</th>
              <th className="text-center text-[#8E8E93] text-sm font-medium px-4 py-3">Status</th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bonds.map((bond) => {
              const maturity = bond.maturityDate ? new Date(bond.maturityDate) : null;
              const isMatured = maturity ? maturity < new Date() : false;

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
                      Rs.{' '}
                      {Number.parseFloat(bond.nav).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-[#22C55E]">
                      {Number.parseFloat(bond.fixedReturn || '0').toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {maturity ? (
                      <span className={isMatured ? 'text-[#F59E0B]' : 'text-[#8E8E93]'}>
                        {maturity.toLocaleDateString('en-IN', {
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

