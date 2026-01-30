import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/Card';
import { getBaseUrl } from '@/lib/get-base-url';
import { formatCurrency, formatDate } from '@/lib/utils';

type Bond = {
  id: string;
  name: string;
  nav: string;
  minInvestment: string;
  fixedReturn: string | null;
  maturityDate: string | null;
  launchDate: string | null;
  description: string | null;
  isActive: boolean | null;
};

type EsgReport = {
  id: string;
  reportName: string | null;
  reportYear: string | null;
  reportUrl: string;
  uploadedAt: string | Date | null;
};

async function getBond(id: string): Promise<{ bond: Bond; esgReports: EsgReport[] } | null> {
  const baseUrl = await getBaseUrl();
  const res = await fetch(new URL(`/api/bonds/${id}`, baseUrl), { cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { bond: Bond; esgReports: EsgReport[] } };
  return json.data ?? null;
}

export default async function BondDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getBond(id);
  if (!data) notFound();

  const { bond, esgReports } = data;
  const maturity = bond.maturityDate ? new Date(bond.maturityDate) : null;
  const isMatured = maturity ? maturity < new Date() : false;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/bonds" className="text-[#3B82F6] text-sm hover:underline">
          Back to Green Bonds
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">{bond.name}</h1>
        <p className="text-[#8E8E93] text-sm mt-1">Bond details and ESG compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-[#8E8E93]">Face Value</p>
          <p className="text-xl font-semibold mt-1">{formatCurrency(bond.nav)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[#8E8E93]">Coupon Rate</p>
          <p className="text-xl font-semibold mt-1">
            {bond.fixedReturn ? `${Number.parseFloat(bond.fixedReturn).toFixed(2)}%` : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[#8E8E93]">Min Investment</p>
          <p className="text-xl font-semibold mt-1">{formatCurrency(bond.minInvestment)}</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-[#8E8E93]">Issue Date</p>
            <p className="text-sm text-white mt-1">{bond.launchDate ? formatDate(bond.launchDate) : '—'}</p>
          </div>
          <div>
            <p className="text-sm text-[#8E8E93]">Maturity Date</p>
            <p className={`text-sm mt-1 ${isMatured ? 'text-[#F59E0B]' : 'text-white'}`}>
              {bond.maturityDate ? formatDate(bond.maturityDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#8E8E93]">Status</p>
            <p className="text-sm text-white mt-1">{isMatured ? 'Matured' : bond.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        {bond.description && (
          <div className="pt-4 border-t border-[#2C2C2E]">
            <p className="text-sm text-[#8E8E93] mb-2">Description</p>
            <p className="text-sm text-white leading-relaxed">{bond.description}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white">ESG Reports</h2>
        {esgReports.length === 0 ? (
          <p className="text-[#8E8E93] text-sm mt-2">No ESG reports uploaded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {esgReports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-[#121212] border border-[#2C2C2E] rounded-lg p-3"
              >
                <div>
                  <p className="text-sm text-white">{r.reportName || 'ESG Report'}</p>
                  <p className="text-xs text-[#8E8E93]">
                    {r.reportYear ? `Year ${r.reportYear}` : 'Year —'}
                    {r.uploadedAt ? ` · Uploaded ${formatDate(r.uploadedAt)}` : ''}
                  </p>
                </div>
                <span className="text-xs text-[#8E8E93] truncate max-w-[240px]">{r.reportUrl}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

