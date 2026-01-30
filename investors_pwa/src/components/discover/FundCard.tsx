'use client';

import Link from 'next/link';

import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { Fund } from '@/db/schema';

interface FundCardProps {
  fund: Fund;
}

export function FundCard({ fund }: FundCardProps) {
  const displayReturn = fund.type === 'GREEN_FUND' ? fund.cagr1y : fund.fixedReturn;
  const returnLabel = fund.type === 'GREEN_FUND' ? '1Y CAGR' : 'Fixed Return';

  return (
    <Link href={`/discover/fund/${fund.id}`}>
      <Card className="hover:bg-gray-800 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{fund.name}</h3>
            <p className="text-sm text-gray-500">
              {fund.type === 'GREEN_FUND' ? 'Green Fund' : fund.type === 'GREEN_BOND' ? 'Green Bond' : 'InvIT'}
            </p>
          </div>

          <div className="text-right">
            {displayReturn && (
              <p className="text-green-500 font-medium">{formatPercent(Number.parseFloat(displayReturn))}</p>
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

