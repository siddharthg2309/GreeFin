'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { BuyModal } from '@/components/fund/BuyModal';
import { SipModal } from '@/components/fund/SipModal';
import { formatCurrency } from '@/lib/utils';

type FundLike = {
  id: string;
  name: string;
  type: 'GREEN_BOND' | 'INVIT' | 'GREEN_FUND';
  nav: string;
  minInvestment: string;
};

export function FundActions({ fund }: { fund: FundLike }) {
  const [showBuy, setShowBuy] = useState(false);
  const [showSip, setShowSip] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSuccess = (data: { message?: string }) => {
    setToast(data.message ?? 'Done');
    setShowBuy(false);
    setShowSip(false);
    window.setTimeout(() => setToast(null), 4000);
  };

  return (
    <>
      {showBuy && <BuyModal fund={fund} onClose={() => setShowBuy(false)} onSuccess={handleSuccess} />}
      {showSip && <SipModal fund={fund} onClose={() => setShowSip(false)} onSuccess={handleSuccess} />}

      {toast && (
        <div className="fixed bottom-36 left-0 right-0 px-4 z-40">
          <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm text-gray-200">
            {toast}
          </div>
        </div>
      )}

      <div className="fixed bottom-16 left-0 right-0 bg-black border-t border-gray-800 p-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Min. investment</p>
            <p className="text-sm text-gray-200">{formatCurrency(fund.minInvestment)}</p>
          </div>
          <Button variant="secondary" className="flex-1" onClick={() => setShowSip(true)}>
            Start SIP
          </Button>
          <Button className="flex-1" onClick={() => setShowBuy(true)}>
            Invest
          </Button>
        </div>
      </div>
    </>
  );
}
