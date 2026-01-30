'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

interface BuyModalProps {
  fund: FundLike;
  onClose: () => void;
  onSuccess: (data: { message?: string }) => void;
}

type FundLike = {
  id: string;
  name: string;
  type: 'GREEN_BOND' | 'INVIT' | 'GREEN_FUND';
  nav: string;
  minInvestment: string;
};

export function BuyModal({ fund, onClose, onSuccess }: BuyModalProps) {
  const [amount, setAmount] = useState(Number.parseFloat(fund.minInvestment));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nav = Number.parseFloat(fund.nav);
  const minInvestment = Number.parseFloat(fund.minInvestment);
  const quantity = nav > 0 ? amount / nav : 0;
  const greenCredits = amount * 0.05;

  const handleQuickAdd = (addAmount: number) => {
    setAmount((prev) => prev + addAmount);
  };

  const handleBuy = async () => {
    if (amount < minInvestment) {
      setError(`Minimum investment is ${formatCurrency(minInvestment)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundId: fund.id, amount }),
      });

      const data: { success: boolean; data?: { message?: string }; error?: string } = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to place order');
        return;
      }

      onSuccess(data.data ?? {});
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-gray-900 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Buy</h2>
          <button type="button" onClick={onClose} className="p-2" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full" />
          <div>
            <h3 className="font-medium">{fund.name}</h3>
            <p className="text-sm text-gray-500">{fund.type.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-2">Investment amount</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl">₹</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number.parseFloat(e.target.value) || 0)}
              className="text-2xl bg-transparent border-none p-0"
              min={0}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => handleQuickAdd(500)} className="text-blue-500 text-sm">
                +500
              </button>
              <button type="button" onClick={() => handleQuickAdd(1000)} className="text-blue-500 text-sm">
                +1000
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Min. {formatCurrency(minInvestment)} (multiple of ₹1)</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500">Place order at NAV</p>
          <p className="text-lg">₹ {nav.toFixed(4)}</p>
          <p className="text-xs text-gray-500">Current NAV: ₹{nav.toFixed(4)}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Units (approx.)</span>
            <span>{quantity.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Green Credits earned</span>
            <span className="text-green-500">+{formatCurrency(greenCredits)}</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <Button onClick={handleBuy} disabled={loading || amount < minInvestment} className="w-full" size="lg">
          {loading ? 'Processing...' : `Buy for ${formatCurrency(amount)}`}
        </Button>
      </div>
    </div>
  );
}
