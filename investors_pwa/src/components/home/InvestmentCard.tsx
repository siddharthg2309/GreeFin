'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface InvestmentCardProps {
  totalInvested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  xirr: number;
}

export function InvestmentCard({ totalInvested, currentValue, pnl, pnlPercent, xirr }: InvestmentCardProps) {
  const isPositive = pnl >= 0;

  return (
    <Card className="bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">Your investments</span>
        <Link href="/investments" className="text-blue-500 text-sm flex items-center gap-1">
          View <RefreshCw className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">P&amp;L</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-white' : 'text-red-500'}`}>{formatCurrency(pnl)}</p>
          <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(pnlPercent)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">XIRR</p>
          <p className={`text-sm ${xirr >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(xirr)}</p>
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

