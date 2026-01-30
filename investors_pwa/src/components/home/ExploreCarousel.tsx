'use client';

import Link from 'next/link';
import { Building, Leaf, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/Card';

const categories = [
  {
    id: 'GREEN_FUND',
    title: 'Green Mutual Funds',
    description: 'ESG & renewable energy funds',
    icon: Leaf,
    color: 'bg-green-500/20 text-green-500',
  },
  {
    id: 'GREEN_BOND',
    title: 'Green Bonds',
    description: 'Fixed return green bonds',
    icon: Building,
    color: 'bg-blue-500/20 text-blue-500',
  },
  {
    id: 'INVIT',
    title: 'Green InvITs',
    description: 'Infrastructure trusts',
    icon: TrendingUp,
    color: 'bg-purple-500/20 text-purple-500',
  },
];

export function ExploreCarousel() {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Explore investment ideas</h2>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {categories.map(({ id, title, description, icon: Icon, color }) => (
          <Link key={id} href={`/discover?type=${id}`}>
            <Card className="min-w-[200px] hover:bg-gray-800 transition-colors">
              <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-medium mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-2">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <div className="w-2 h-2 rounded-full bg-gray-600" />
        <div className="w-2 h-2 rounded-full bg-gray-600" />
      </div>
    </div>
  );
}

