'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

interface SipModalProps {
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

export function SipModal({ fund, onClose, onSuccess }: SipModalProps) {
  const minInvestment = Number.parseFloat(fund.minInvestment);

  const [installmentAmount, setInstallmentAmount] = useState(minInvestment);
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateSip = async () => {
    if (installmentAmount < minInvestment) {
      setError(`Minimum SIP amount is ${formatCurrency(minInvestment)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundId: fund.id,
          installmentAmount,
          frequency,
          startDate,
        }),
      });

      const data: { success: boolean; data?: { message?: string }; error?: string } = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to create SIP');
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
          <h2 className="text-xl font-semibold">Create SIP</h2>
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
          <label className="text-sm text-gray-500 block mb-2">Installment amount</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl">₹</span>
            <Input
              type="number"
              value={installmentAmount}
              onChange={(e) => setInstallmentAmount(Number.parseFloat(e.target.value) || 0)}
              className="text-2xl bg-transparent border-none p-0"
              min={0}
            />
            <button type="button" onClick={() => setInstallmentAmount((prev) => prev + 1000)} className="text-blue-500 text-sm">
              +1000
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Min. {formatCurrency(minInvestment)} (multiple of ₹1)</p>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-500 block mb-2">Frequency</label>
          <div className="flex gap-4">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'WEEKLY' | 'MONTHLY')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 flex-1"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-500 block mb-2">Start date</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Amount per installment</span>
            <span>{formatCurrency(installmentAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Frequency</span>
            <span>{frequency.charAt(0) + frequency.slice(1).toLowerCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Green Credits per installment</span>
            <span className="text-green-500">+{formatCurrency(installmentAmount * 0.05)}</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <Button
          onClick={handleCreateSip}
          disabled={loading || installmentAmount < minInvestment}
          className="w-full"
          size="lg"
        >
          {loading ? 'Creating...' : 'Create SIP'}
        </Button>
      </div>
    </div>
  );
}
