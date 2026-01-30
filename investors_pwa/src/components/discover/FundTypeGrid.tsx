'use client';

import Link from 'next/link';
import { Building, Building2, TrendingUp } from 'lucide-react';

const fundTypes = [
  {
    id: 'GREEN_FUND',
    name: 'Green Funds',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
  },
  {
    id: 'GREEN_BOND',
    name: 'Green Bonds',
    icon: Building,
    iconColor: 'text-blue-500',
  },
  {
    id: 'INVIT',
    name: 'InvITs',
    icon: Building2,
    iconColor: 'text-amber-500',
  },
];

export function FundTypeGrid() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#9B9B9B]">Get started</p>
      <p className="text-base text-white">Find the right fund across these categories</p>

      {/* Institutional fintech design: sharp edges, unified spine */}
      <div className="mt-4 bg-[#1C1C1E] rounded-sm overflow-hidden">
        {fundTypes.map(({ id, name, icon: Icon, iconColor }, index) => (
          <Link key={id} href={`/discover?type=${id}`}>
            <div
              className={`flex items-center gap-5 px-5 py-5 hover:bg-[#262626] transition-colors ${index !== fundTypes.length - 1 ? 'border-b border-[#333333]' : ''
                }`}
            >
              {/* Icon with "Spark" glow effect */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                {/* The Spark - blur glow behind icon */}
                <div
                  className={`absolute inset-0 rounded-full blur-xl opacity-20 ${id === 'GREEN_FUND'
                    ? 'bg-emerald-500'
                    : id === 'GREEN_BOND'
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                    }`}
                />
                <Icon className={`w-6 h-6 ${iconColor} relative z-10`} strokeWidth={1.5} />
              </div>
              <span className="text-[15px] font-medium text-white">{name}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
