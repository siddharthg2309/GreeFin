'use client';

import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

type FundLike = {
  id: string;
  minInvestment: string;
};

export function FundActions({ fund }: { fund: FundLike }) {
  return (
    <div className="fixed bottom-16 left-0 right-0 bg-black border-t border-gray-800 p-4">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500">Min. investment</p>
          <p className="text-sm text-gray-200">{formatCurrency(fund.minInvestment)}</p>
        </div>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => alert('SIP setup comes in Phase 3')}
        >
          Start SIP
        </Button>
        <Button className="flex-1" onClick={() => alert('Invest flow comes in Phase 3')}>Invest</Button>
      </div>
    </div>
  );
}

