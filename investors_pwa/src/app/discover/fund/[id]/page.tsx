import { notFound } from 'next/navigation';

import { FundActions } from '@/components/fund/FundActions';
import { FundHeader } from '@/components/fund/FundHeader';
import { PriceChart } from '@/components/fund/PriceChart';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { getBaseUrl } from '@/lib/get-base-url';

type ChartPoint = { date: string; price: number };
type PriceHistory = Record<string, ChartPoint[]>;

type FundDetail = {
  id: string;
  name: string;
  type: 'GREEN_BOND' | 'INVIT' | 'GREEN_FUND';
  nav: string;
  minInvestment: string;
  fixedReturn: string | null;
  cagr1y: string | null;
  expenseRatio: string | null;
  launchDate: string | null;
  description: string | null;
  priceHistory?: PriceHistory;
};

async function getFund(id: string) {
  const res = await fetch(`${await getBaseUrl()}/api/funds/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data as FundDetail;
}

export default async function FundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fund = await getFund(id);

  if (!fund) {
    notFound();
  }

  return (
    <div className="pb-24">
      <FundHeader fund={fund} />

      <div className="p-4">
        <p className="text-sm text-gray-500">
          Current NAV (
          {new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
          )
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-500">{formatCurrency(fund.nav)}</span>
          {fund.cagr1y && <span className="text-green-500">{formatPercent(Number.parseFloat(fund.cagr1y))}</span>}
        </div>
      </div>

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

      {fund.priceHistory && <PriceChart priceHistory={fund.priceHistory} />}

      <FundActions fund={fund} />
    </div>
  );
}
