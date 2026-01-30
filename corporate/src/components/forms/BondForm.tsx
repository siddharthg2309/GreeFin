'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

import { EsgUpload } from './EsgUpload';

interface BondFormData {
  name: string;
  nav: string;
  minInvestment: string;
  fixedReturn: string;
  maturityDate: string;
  launchDate: string;
  description: string;
}

type CreateBondResponse =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export function BondForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFundId, setCreatedFundId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BondFormData>({
    name: '',
    nav: '1000',
    minInvestment: '',
    fixedReturn: '',
    maturityDate: '',
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

    if (new Date(formData.maturityDate) <= new Date(formData.launchDate)) {
      setError('Maturity date must be after launch date');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/bonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nav: Number.parseFloat(formData.nav),
          minInvestment: Number.parseFloat(formData.minInvestment),
          fixedReturn: Number.parseFloat(formData.fixedReturn),
        }),
      });

      const data = (await response.json()) as CreateBondResponse;
      if (!response.ok || !data.success) {
        throw new Error(!data.success ? data.error : 'Failed to create bond');
      }

      setCreatedFundId(data.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEsgUploadComplete = () => {
    router.push('/bonds');
  };

  const handleSkipEsg = () => {
    router.push('/bonds');
  };

  if (createdFundId) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload ESG Report (Optional)</h2>
        <p className="text-[#8E8E93] text-sm mb-6">
          Green Bond created successfully. You can now upload an ESG compliance report.
        </p>
        <EsgUpload fundId={createdFundId} onComplete={handleEsgUploadComplete} />
        <Button variant="ghost" onClick={handleSkipEsg} className="mt-4 w-full">
          Skip for now
        </Button>
      </Card>
    );
  }

  const showTenure = formData.launchDate && formData.maturityDate;
  const tenureYears = showTenure
    ? Math.ceil(
        (new Date(formData.maturityDate).getTime() - new Date(formData.launchDate).getTime()) /
          (1000 * 60 * 60 * 24 * 365)
      )
    : 0;

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
            label="Bond Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter Green Bond name"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the green project this bond funds"
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
              label="Face Value (NAV in Rupees)"
              name="nav"
              type="number"
              step="0.01"
              value={formData.nav}
              onChange={handleChange}
              placeholder="1000.00"
              required
            />

            <Input
              label="Min Investment (in Rupees)"
              name="minInvestment"
              type="number"
              step="0.01"
              value={formData.minInvestment}
              onChange={handleChange}
              placeholder="1000.00"
              required
            />
          </div>

          <Input
            label="Coupon Rate / Fixed Return (%)"
            name="fixedReturn"
            type="number"
            step="0.01"
            value={formData.fixedReturn}
            onChange={handleChange}
            placeholder="7.5"
            required
          />

          <div className="bg-[#2C2C2E]/50 rounded-lg p-3">
            <p className="text-[#8E8E93] text-xs">
              Note: Green Bonds have fixed returns only. Unlike InvITs, there is no NAV appreciation or
              CAGR data.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wide">Issue & Maturity</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date (Launch)"
              name="launchDate"
              type="date"
              value={formData.launchDate}
              onChange={handleChange}
              required
            />

            <Input
              label="Maturity Date"
              name="maturityDate"
              type="date"
              value={formData.maturityDate}
              onChange={handleChange}
              required
            />
          </div>

          {showTenure && (
            <div className="bg-[#1C1C1E] rounded-lg p-3 border border-[#2C2C2E]">
              <p className="text-[#8E8E93] text-sm">
                Tenure:{' '}
                <span className="text-white font-medium">{tenureYears} year(s)</span>
              </p>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating Bond...' : 'Create Green Bond'}
        </Button>
      </Card>
    </form>
  );
}

