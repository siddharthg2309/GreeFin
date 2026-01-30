'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

type ApiResponse = { success: true } | { success: false; error: string };

export function CsrAllocationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    totalAmount: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/csr-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: Number.parseFloat(formData.totalAmount),
          description: formData.description || null,
        }),
      });

      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.success) {
        throw new Error(!data.success ? data.error : 'Failed to allocate CSR funds');
      }

      router.push('/csr-funds');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100000, 500000, 1000000, 5000000];

  const handleQuickAdd = (amount: number) => {
    setFormData((prev) => ({
      ...prev,
      totalAmount: (Number.parseFloat(prev.totalAmount || '0') + amount).toString(),
    }));
  };

  const parsedAmount = formData.totalAmount ? Number.parseFloat(formData.totalAmount) : 0;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">Allocation Amount</h3>

          <Input
            label="Total Amount (in Rupees)"
            name="totalAmount"
            type="number"
            step="0.01"
            min="1"
            value={formData.totalAmount}
            onChange={handleChange}
            placeholder="Enter CSR allocation amount"
            required
          />

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAdd(amount)}
                className="px-3 py-1.5 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white text-sm rounded-lg transition-colors"
              >
                +Rs. {(amount / 100000).toFixed(0)}L
              </button>
            ))}
          </div>

          {formData.totalAmount && Number.isFinite(parsedAmount) && parsedAmount > 0 && (
            <div className="bg-[#1C1C1E] rounded-lg p-3 border border-[#2C2C2E]">
              <p className="text-[#8E8E93] text-sm">
                Amount:{' '}
                <span className="text-white font-medium">
                  Rs.{' '}
                  {parsedAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">Details (Optional)</h3>

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the purpose of this CSR allocation (e.g., FY 2025-26 Green Credits Fund)"
            rows={3}
          />
        </div>

        <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg p-4">
          <h4 className="text-[#3B82F6] font-medium text-sm mb-2">How CSR Funds Work</h4>
          <ul className="text-[#8E8E93] text-sm space-y-1">
            <li>- Allocated funds subsidize investor green credit redemptions</li>
            <li>- When investors claim credits for green purchases, your CSR funds are used</li>
            <li>- Track all redemptions in real-time from this dashboard</li>
            <li>- Allocation is marked as exhausted when fully utilized</li>
          </ul>
        </div>

        <Button type="submit" className="w-full" disabled={loading || !formData.totalAmount}>
          {loading ? 'Allocating...' : 'Allocate CSR Funds'}
        </Button>
      </Card>
    </form>
  );
}

