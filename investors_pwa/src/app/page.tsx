import Link from 'next/link';
import { Search } from 'lucide-react';

import { ExploreCarousel } from '@/components/home/ExploreCarousel';
import { ImpactMetrics } from '@/components/home/ImpactMetrics';
import { InvestmentCard } from '@/components/home/InvestmentCard';
import { mockUser } from '@/lib/mock-user';
import { getBaseUrl } from '@/lib/get-base-url';

async function getPortfolioSummary(baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/portfolio/summary`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data as {
    totalInvested: number;
    currentValue: number;
    totalPnl: number;
    pnlPercent: number;
    xirr: number;
  };
}

async function getImpactMetrics(baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/impact`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data as {
    co2Avoided: number;
    cleanEnergyGenerated: number;
    airQualityScore: number;
    treesEquivalent: number;
  };
}

export default async function HomePage() {
  const baseUrl = await getBaseUrl();
  const [portfolio, impact] = await Promise.all([getPortfolioSummary(baseUrl), getImpactMetrics(baseUrl)]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-full" />
          <div>
            <h1 className="text-lg font-semibold">Hi {mockUser.name.split(' ')[0]}</h1>
            <p className="text-sm text-gray-500">Welcome to GreenFin</p>
          </div>
        </div>
        <Link href="/discover" className="p-2" aria-label="Search funds">
          <Search className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {portfolio && (
        <InvestmentCard
          totalInvested={portfolio.totalInvested}
          currentValue={portfolio.currentValue}
          pnl={portfolio.totalPnl}
          pnlPercent={portfolio.pnlPercent}
          xirr={portfolio.xirr}
        />
      )}

      <ExploreCarousel />

      {impact && (
        <ImpactMetrics
          co2Avoided={impact.co2Avoided}
          cleanEnergyGenerated={impact.cleanEnergyGenerated}
          treesEquivalent={impact.treesEquivalent}
        />
      )}
    </div>
  );
}
