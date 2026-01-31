'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

import { EsgUpload } from './EsgUpload';

interface InvitFormData {
  name: string;
  nav: string;
  minInvestment: string;
  fixedReturn: string;
  cagr1y: string;
  cagr2y: string;
  cagr3y: string;
  expenseRatio: string;
  launchDate: string;
  description: string;
}

type CreateInvitResponse =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export function InvitForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFundId, setCreatedFundId] = useState<string | null>(null);

  const [formData, setFormData] = useState<InvitFormData>({
    name: '',
    nav: '',
    minInvestment: '',
    fixedReturn: '',
    cagr1y: '',
    cagr2y: '',
    cagr3y: '',
    expenseRatio: '',
    launchDate: '',
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
      const response = await fetch('/api/invits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nav: Number.parseFloat(formData.nav),
          minInvestment: Number.parseFloat(formData.minInvestment),
          fixedReturn: Number.parseFloat(formData.fixedReturn),
          cagr1y: formData.cagr1y ? Number.parseFloat(formData.cagr1y) : null,
          cagr2y: formData.cagr2y ? Number.parseFloat(formData.cagr2y) : null,
          cagr3y: formData.cagr3y ? Number.parseFloat(formData.cagr3y) : null,
          expenseRatio: formData.expenseRatio ? Number.parseFloat(formData.expenseRatio) : null,
        }),
      });

      const data = (await response.json()) as CreateInvitResponse;
      if (!response.ok || !data.success) {
        throw new Error(!data.success ? data.error : 'Failed to create InvIT');
      }

      setCreatedFundId(data.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEsgUploadComplete = () => {
    router.push('/invits');
  };

  const handleSkipEsg = () => {
    router.push('/invits');
  };

  if (createdFundId) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload ESG Report (Optional)</h2>
        <p className="text-[#8E8E93] text-sm mb-6">
          InvIT created successfully. You can now upload an ESG compliance report.
        </p>
        <EsgUpload fundId={createdFundId} onComplete={handleEsgUploadComplete} />
        <Button variant="ghost" onClick={handleSkipEsg} className="mt-4 w-full">
          Skip for now
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Basic Information
          </h3>

          <Input
            label="InvIT Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter InvIT name"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the InvIT and its investment focus"
            rows={4}
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Financial Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="NAV (in Rupees)"
              name="nav"
              type="number"
              step="0.01"
              value={formData.nav}
              onChange={handleChange}
              placeholder="100.00"
              required
            />

            <Input
              label="Min Investment (in Rupees)"
              name="minInvestment"
              type="number"
              step="0.01"
              value={formData.minInvestment}
              onChange={handleChange}
              placeholder="500.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fixed Return (%)"
              name="fixedReturn"
              type="number"
              step="0.01"
              value={formData.fixedReturn}
              onChange={handleChange}
              placeholder="8.5"
              required
            />

            <Input
              label="Expense Ratio (%)"
              name="expenseRatio"
              type="number"
              step="0.01"
              value={formData.expenseRatio}
              onChange={handleChange}
              placeholder="1.5"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">
            Historical Performance (CAGR)
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="1 Year (%)"
              name="cagr1y"
              type="number"
              step="0.01"
              value={formData.cagr1y}
              onChange={handleChange}
              placeholder="12.5"
            />

            <Input
              label="2 Years (%)"
              name="cagr2y"
              type="number"
              step="0.01"
              value={formData.cagr2y}
              onChange={handleChange}
              placeholder="10.2"
            />

            <Input
              label="3 Years (%)"
              name="cagr3y"
              type="number"
              step="0.01"
              value={formData.cagr3y}
              onChange={handleChange}
              placeholder="9.8"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">Launch Details</h3>

          <Input
            label="Launch Date"
            name="launchDate"
            type="date"
            value={formData.launchDate}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating InvIT...' : 'Create InvIT'}
        </Button>
      </Card>
    </form>
  );
}

